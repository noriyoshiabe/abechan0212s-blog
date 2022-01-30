const fs = require("fs");
const path = require("path");
const webpack = require('webpack');
const YAML = require('yaml');
const RSS = require('rss');

const HtmlWebpackPlugin = require("html-webpack-plugin");
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const prettydata = require('pretty-data');
const CopyPlugin = require("copy-webpack-plugin");

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
    let willCopyAssets = [];

    let posts = {};

    const defaultHtmlPluginOptions = {
      template: "public/index.html",
      title: siteName,
      description: "abechan0212のブログです。",
      url: `${baseURL}/`,
      imgUrl: () => `${baseURL}/ogp.png?${compilationHash}`,
      indexJsonPath: () => `/index.json?${compilationHash}`,
    };

    compiler.options.plugins.push(
      new webpack.DefinePlugin({
        "Define.SITE_NAME": JSON.stringify(siteName)
      })
    );

    compiler.options.plugins.push(new HtmlWebpackPlugin(defaultHtmlPluginOptions));

    const master = YAML.parse(fs.readFileSync(path.resolve(__dirname, postsDir, "master.yml"), 'utf8'));

    const indivisualPostDirs = fs.readdirSync(path.resolve(__dirname, postsDir)).filter((dir) => !dir.startsWith('.'));
    indivisualPostDirs.forEach(dir => {
      if (!fs.lstatSync(path.resolve(__dirname, postsDir, dir)).isDirectory()) {
        return;
      }

      let htmlPluginOptions = Object.assign({}, defaultHtmlPluginOptions);
      let permalink = dir.substring(dir.indexOf('_') + 1);
      let post = {
        id: permalink,
        url: `${baseURL}/${permalink}/`,
        path: `/${permalink}/`,
        bodyPath: () => `/${permalink}/body.md?${compilationHash}`,
        imgUrl: defaultHtmlPluginOptions.imgUrl,
      };

      htmlPluginOptions.url = `${baseURL}/${permalink}/`;
      htmlPluginOptions.filename = `${permalink}/index.html`;

      const contents = fs.readdirSync(path.resolve(__dirname, postsDir, dir)).filter((dir) => !dir.startsWith('.'));
      contents.forEach(fileName => {
        let filePath = path.resolve(__dirname, postsDir, dir, fileName);

        switch (fileName) {
        case 'body.md':
          willCopyAssets.push({from: filePath, to: path.join(permalink, fileName)});
          break;
        case 'meta.yml':
          let yamlText = fs.readFileSync(filePath, 'utf8');
          let yaml = YAML.parse(yamlText);
          
          if (!yaml.title) throw new Error(`\`title\` missing in ${filePath}`);
          if (!yaml.description) throw new Error(`\`description\` missing in ${filePath}`);
          if (!yaml.date) throw new Error(`\`date\` missing in ${filePath}`);
          if (!yaml.tags) throw new Error(`\`tags\` missing in ${filePath}`);
          if (!yaml.tags instanceof Array) throw new Error(`\`tags\` in ${filePath} is not array`);
          yaml.tags.forEach(tag => {
            if (!master.tags.includes(tag)) {
              throw new Error(`\`${tag}\` is not exist in master`);
            }
          });

          if (yaml.attachments) {
            if (!yaml.attachments instanceof Array) throw new Error(`\`attachments\` in ${filePath} is not array`);
            yaml.attachments.forEach(attachment => {
              let filePath = path.resolve(__dirname, postsDir, dir, attachment);
              willCopyAssets.push({from: filePath, to: path.join(permalink, attachment)});
            });
          }

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
          htmlPluginOptions.imgUrl = post.imgUrl
          break;
        case 'thumbnail.png':
        case 'thumbnail.jpg':
          willEmitAssets.push({fromPath: filePath, toPath: path.join(permalink, fileName)});
          post.thumbnailPath = () => `/${permalink}/${fileName}?${compilationHash}`;
          break;
        default:
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
        'path',
        'bodyPath',
        'url',
        'imgUrl',
        'thumbnailPath',
      ]); // for json key order

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

    compiler.options.plugins.push(
      new CopyPlugin({patterns: willCopyAssets})
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
            if (p.bodyPath) p.bodyPath = p.bodyPath();
            if (p.thumbnailPath) p.thumbnailPath = p.thumbnailPath();
          });

          let siteIndex = {
            top,
            posts: {
              byId: _posts,
              ids: Object.keys(_posts).reverse(),
            },
            tags: master.tags,
          };
          compilation.emitAsset('index.json', new webpack.sources.RawSource(JSON.stringify(siteIndex, null, 2)));


          let feed = new RSS({
            title: top.title,
            description: top.description,
            site_url: top.url,
            pubDate: Object.values(_posts).map(p => p.lastModified ?? p.date).reduce((a, b) => a > b ? a : b), // MAX
          });
          Object.values(_posts).forEach(p => {
            feed.item({
              title: p.title,
              description: p.description,
              url: p.url,
              date: p.lastModified ?? p.date,
            });
          });
          compilation.emitAsset('rss.xml', new webpack.sources.RawSource(feed.xml({indent: true})));

          return callback();
        });
    });
	}
}

module.exports = SSGPlugin;
