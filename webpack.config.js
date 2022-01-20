// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const CopyPlugin = require("copy-webpack-plugin");

const isProduction = process.env.NODE_ENV == "production";

const stylesHandler = MiniCssExtractPlugin.loader;

const SSGPlugin = require("./webpack.ssg.js");

const config = {
  entry: {
    app: [
      "core-js/stable",
      "regenerator-runtime/runtime",
      "normalize.css",
      "./src/index.scss",
      "./src/index.js",
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js?[hash]",
    hashDigestLength: 8,
    assetModuleFilename: '[name][ext]?[hash]',
    publicPath: "/",
  },
  devServer: {
    open: true,
    host: "0.0.0.0",
  },
  target: ["web", "es5"],
  plugins: [
    new SSGPlugin(),

    new CopyPlugin({
      patterns: [
        {
          from: "public",
          globOptions: {
            ignore: ["**/index.html"],
          }
        },
      ],
    }),

    new MiniCssExtractPlugin({
      filename: "[name].css?[hash]",
    }),

    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/i,
        loader: "babel-loader",
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader", "postcss-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [stylesHandler, "css-loader", "sass-loader", "postcss-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
        exclude: [
          path.join(__dirname, 'public/'),
        ]
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
