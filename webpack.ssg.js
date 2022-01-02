const fs = require("fs");
const path = require("path");
const webpack = require('webpack');
const YAML = require('yaml');

const HtmlWebpackPlugin = require("html-webpack-plugin");
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const prettydata = require('pretty-data');

const isProduction = process.env.NODE_ENV == "production";
const stage = isProduction ? process.env.STAGE || "production" : "local";

const baseURL = {
  local: "http://localhost:8080",
  staging: "https://staging.nasequencer.com",
  production: "https://abechan0212.nasequencer.com",
}[stage];

const siteName = "abechan0212's blog";
const postsDir = "./posts";

function pickAndSetNull(object, keys) {
  return keys.reduce((obj, key) => {
    obj[key] = object[key] ?? null;
    return obj;
  }, {});
}

function keyBy(array, key) {
  return (array || []).reduce((r, x) => ({ ...r, [key ? x[key] : x]: x }), {});
}

class SSGPlugin {
  apply(compiler) {
    let compilationHash;
    let willEmitAssets = [];

    let posts = {};
    let tags = new Set();

    const defaultHtmlPluginOptions = {
      template: "public/index.html",
      title: siteName,
      description: "abechan0212のブログです。",
      url: baseURL,
      imgUrl: () => `${baseURL}/ogp.png?${compilationHash}`,
      indexJsonUrl: () => `/index.json?${compilationHash}`,
    };

    compiler.options.plugins.push(
      new webpack.DefinePlugin({
        "Define.SITE_NAME": JSON.stringify(siteName)
      })
    );

    compiler.options.plugins.push(new HtmlWebpackPlugin(defaultHtmlPluginOptions));

    const indivisualPostDirs = fs.readdirSync(path.resolve(__dirname, postsDir)).filter((dir) => !dir.startsWith('.'));
    indivisualPostDirs.forEach(dir => {
      let htmlPluginOptions = Object.assign({}, defaultHtmlPluginOptions);
      let permalink = dir.substring(9);
      let post = {
        id: permalink,
        url: `/${permalink}`,
        bodyUrl: () => `/${permalink}/body.md?${compilationHash}`,
        imgUrl: defaultHtmlPluginOptions.imgUrl,
      };

      htmlPluginOptions.url = `${baseURL}/${permalink}`;
      htmlPluginOptions.filename = `${permalink}/index.html`;

      const contents = fs.readdirSync(path.resolve(__dirname, postsDir, dir)).filter((dir) => !dir.startsWith('.'));
      contents.forEach(fileName => {
        let filePath = path.resolve(__dirname, postsDir, dir, fileName);

        switch (fileName) {
        case 'body.md':
          willEmitAssets.push({fromPath: filePath, toPath: path.join(permalink, fileName)});
          break;
        case 'meta.yml':
          let yamlText = fs.readFileSync(filePath, 'utf8');
          let yaml = YAML.parse(yamlText);
          
          if (!yaml.title) throw new Error(`\`title\` missing in ${filePath}`);
          if (!yaml.description) throw new Error(`\`description\` missing in ${filePath}`);
          if (!yaml.date) throw new Error(`\`date\` missing in ${filePath}`);
          if (!yaml.tags) throw new Error(`\`tags\` missing in ${filePath}`);
          if (!yaml.tags instanceof Array) throw new Error(`\`tags\` in ${filePath} is not array`);

          htmlPluginOptions.title = `${yaml.title} - ${siteName}`;
          htmlPluginOptions.description = yaml.description;

          post.title = yaml.title;
          post.htmlTitle = `${yaml.title} - ${siteName}`;
          post.description = yaml.description;
          post.date = yaml.date;
          post.tags = yaml.tags;
          post.lastModified = yaml.lastModified;
          break;
        case 'ogp.png':
          willEmitAssets.push({fromPath: filePath, toPath: path.join(permalink, fileName)});
          post.imgUrl = () => `${baseURL}/${permalink}/${fileName}?${compilationHash}`;
          break;
        case 'thumbnail.png':
          willEmitAssets.push({fromPath: filePath, toPath: path.join(permalink, fileName)});
          post.thumbnailUrl = () => `/${permalink}/${fileName}?${compilationHash}`;
          break;
        default:
          console.warn(`Unexpected file name \`${fileName}\``);
          break;
        }
      });

      posts[post.id] = pickAndSetNull(post, [
        'id',
        'title',
        'htmlTitle',
        'description',
        'date',
        'lastModified',
        'tags',
        'bodyUrl',
        'url',
        'imgUrl',
        'thumbnailUrl',
      ]); // for json key order

      post.tags.forEach(t => tags.add(t));

      compiler.options.plugins.push(new HtmlWebpackPlugin(htmlPluginOptions));
    });

    let paths = Object.values(posts).map(p => {
      return {
        path: p.url,
        lastmod: p.lastModified ?? p.date,
      }
    });
    paths.unshift({
      path: '/',
      lastmod: paths.map(p => p.lastmod).reduce((a, b) => a > b ? a : b), // MAX
    });

    compiler.options.plugins.push(
      new SitemapPlugin({
        base: baseURL,
        paths,
        options: {
          skipgzip: true,
          formatter: (xml) => prettydata.pd.xml(xml),
        },
      })
    );

    compiler.hooks.thisCompilation.tap('SSGPlugin',
      (compilation) => {
        compilation.hooks.processAssets.tapAsync({
          name: 'SSGPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
        }, (compilationAssets, callback) => {
          compilationHash = compilation.hash;

          willEmitAssets.forEach(asset => {
            let content = fs.readFileSync(asset.fromPath);
            compilation.emitAsset(asset.toPath, new webpack.sources.RawSource(content));
          });

          let top = Object.assign({htmlTitle: defaultHtmlPluginOptions.title}, defaultHtmlPluginOptions);
          top = pickAndSetNull(top, [
            'title',
            'htmlTitle',
            'description',
            'url',
            'imgUrl',
          ]);

          let _posts = keyBy(Object.values(posts).map(p => Object.assign({}, p)), 'id'); // deep copy for dev server
          Object.values(_posts).concat(top).forEach(p => {
            if (p.imgUrl) p.imgUrl = p.imgUrl();
            if (p.bodyUrl) p.bodyUrl = p.bodyUrl();
            if (p.thumbnailUrl) p.thumbnailUrl = p.thumbnailUrl();
          });

          let siteIndex = {
            top,
            posts: {
              byId: _posts,
              ids: Object.keys(_posts).reverse(),
            },
            tags: Array.from(tags)
          };
          compilation.emitAsset('index.json', new webpack.sources.RawSource(JSON.stringify(siteIndex, null, 2)));

          return callback();
        });
    });
	}
}

module.exports = SSGPlugin;
