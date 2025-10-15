const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devServer: {
    port: 3001,
    hot: true,
    headers: {
      // CORS 설정 - Host 앱(http://localhost:3000)에서 접근 허용
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
  output: {
    // 절대 경로 필수 - Remote 청크 로딩을 위해
    publicPath: 'http://localhost:3001/',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
    // 명시적으로 전역 변수로 노출 (IIFE 스코프 문제 해결)
    library: {
      type: 'var',
      name: 'remoteApp',
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      // 컨테이너 이름 - window.remoteApp으로 노출됨
      name: 'remoteApp',
      // 엔트리 파일명
      filename: 'remoteEntry.js',

      // 노출할 모듈 정의
      exposes: {
        './Button': './src/components/Button',
        './Card': './src/components/Card',
      },

      // 공유 의존성 설정
      shared: {
        react: {
          singleton: true,           // 단일 인스턴스만 사용 (React Hook 에러 방지)
          requiredVersion: '^19.1.0', // Host와 버전 일치
          eager: false,              // lazy loading (Bootstrap 패턴과 함께 사용)
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^19.1.0',
          eager: false,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  // Development 최적화
  devtool: 'inline-source-map',
  // optimization.runtimeChunk 제거: Module Federation container 패턴과 충돌
};
