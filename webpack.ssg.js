const fs = require("fs");
const path = require("path");
const webpack = require('webpack');
const YAML = require('yaml');

const HtmlWebpackPlugin = require("html-webpack-plugin");

const isProduction = process.env.NODE_ENV == "production";

const baseURL = isProduction ? "https://abechan0212.nasequencer.com" : "http://localhost:8080";
const siteName = "abechan0212's blog";
const postsDir = "./posts";

class SSGPlugin {
  apply(compiler) {
    let compilationHash;

    const defaultHtmlPluginOptions = {
      template: "public/index.html",
      title: siteName,
      description: "abechan0212のブログです。",
      url: baseURL,
      imgUrl: () => baseURL + "/ogp.png?" + compilationHash,
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
      let outDir = path.resolve(compiler.options.output.path, permalink);

      htmlPluginOptions.url = baseURL + "/" + permalink;
      htmlPluginOptions.filename = outDir + "/index.html";

      fs.mkdirSync(outDir, {recursive: true});

      const contents = fs.readdirSync(path.resolve(__dirname, postsDir, dir)).filter((dir) => !dir.startsWith('.'));
      contents.forEach(fileName => {
        let filePath = path.resolve(__dirname, postsDir, dir, fileName);

        switch (fileName) {
        case 'body.md':
          fs.copyFileSync(filePath, path.resolve(outDir, fileName));
          break;
        case 'meta.yml':
          let yamlText = fs.readFileSync(filePath, 'utf8')
          let yaml = YAML.parse(yamlText);
          if (!yaml.title) throw new Error(`\`title\` missing in ${filePath}`);
          htmlPluginOptions.title = yaml.title + ' - ' + siteName;
          if (!yaml.description) throw new Error(`\`description\` missing in ${filePath}`);
          htmlPluginOptions.description = yaml.description;
          break;
        case 'ogp.png':
          fs.copyFileSync(filePath, path.resolve(outDir, fileName));
          htmlPluginOptions.imgUrl = () => baseURL + "/" + permalink + "/" + fileName + "?" + compilationHash;
          break;
        case 'thumbnail.png':
          fs.copyFileSync(filePath, path.resolve(outDir, fileName));
          break;
        }
      });

      compiler.options.plugins.push(new HtmlWebpackPlugin(htmlPluginOptions));
    });

    compiler.hooks.thisCompilation.tap('SSGPlugin',
      (compilation) => {
        compilation.hooks.processAssets.tapAsync({
          name: 'SSGPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
        }, (compilationAssets, callback) => {
          compilationHash = compilation.hash;
          return callback();
        });
    });
	}
}

module.exports = SSGPlugin;
