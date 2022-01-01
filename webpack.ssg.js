const fs = require("fs");
const path = require("path");
const webpack = require('webpack');
const YAML = require('yaml');

const HtmlWebpackPlugin = require("html-webpack-plugin");
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const prettydata = require('pretty-data');

const isProduction = process.env.NODE_ENV == "production";

const baseURL = isProduction ? "https://abechan0212.nasequencer.com" : "http://localhost:8080";
const siteName = "abechan0212's blog";
const postsDir = "./posts";

class SSGPlugin {
  apply(compiler) {
    let compilationHash;
    let willEmitAssets = [];

    let byUrl = {};
    let fixed = [];
    let article = [];
    let tag = {};

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
        url: `/${permalink}`,
        bodyUrl: `/${permalink}/body.md`,
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
          if (!yaml.kind) throw new Error(`\`kind\` missing in ${filePath}`);
          if (!yaml.date) throw new Error(`\`date\` missing in ${filePath}`);
          if (!yaml.tags) throw new Error(`\`tags\` missing in ${filePath}`);
          if (!yaml.tags instanceof Array) throw new Error(`\`tags\` in ${filePath} is not array`);

          htmlPluginOptions.title = `${yaml.title} - ${siteName}`;
          htmlPluginOptions.description = yaml.description;

          post.title = yaml.title;
          post.htmlTitle = `${yaml.title} - ${siteName}`;
          post.description = yaml.description;
          post.kind = yaml.kind;
          post.date = yaml.date;
          post.tags = yaml.tags;
          post.lastModified = yaml.lastModified;
          break;
        case 'ogp.png':
          willEmitAssets.push({fromPath: filePath, toPath: path.join(permalink, fileName)});
          htmlPluginOptions.imgUrl = () => `${baseURL}/${permalink}/${fileName}?${compilationHash}`;
          break;
        case 'thumbnail.png':
          willEmitAssets.push({fromPath: filePath, toPath: path.join(permalink, fileName)});
          post.thumbnailUrl = `/${permalink}/${fileName}`;
          break;
        default:
          console.warn(`Unexpected file name \`${fileName}\``);
          break;
        }
      });

      byUrl[post.url] = post;

      switch (post.kind) {
      case 'article':
        article.push(post.url);
        break;
      case 'fixed':
        fixed.push(post.url);
        break;
      default:
        throw new Error(`Unexpected kind \`${post.kind}\``);
        break;
      }

      post.tags.forEach(t => {
        tag[t] = tag[t] || [];
        tag[t].push(post.url);
      });

      compiler.options.plugins.push(new HtmlWebpackPlugin(htmlPluginOptions));
    });

    let siteIndex = {
      top: {
        title: defaultHtmlPluginOptions.title,
        htmlTitle: defaultHtmlPluginOptions.title,
        description: defaultHtmlPluginOptions.description,
        url: defaultHtmlPluginOptions.url,
        imgUrl: defaultHtmlPluginOptions.imgUrl,
      },
      posts: {
        byUrl,
        article,
        fixed,
        tag,
      }
    };

    let paths = Object.values(siteIndex.posts.byUrl).map(p => {
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

          Object.values(siteIndex.posts.byUrl).forEach(post => {
            if (post.thumbnailUrl) {
              post.thumbnailUrl += `?${compilationHash}`
              post.bodyUrl += `?${compilationHash}`
            }
          });

          willEmitAssets.forEach(asset => {
            let content = fs.readFileSync(asset.fromPath, 'utf8');
            compilation.emitAsset(asset.toPath, new webpack.sources.RawSource(content));
          });

          compilation.emitAsset('index.json', new webpack.sources.RawSource(JSON.stringify(siteIndex)));
          return callback();
        });
    });
	}
}

module.exports = SSGPlugin;
