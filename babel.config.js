module.exports = function (api) {
	api.cache(true);
	return {
		presets: ['babel-preset-expo'],
		overrides: [
			{
				test: /src\/database\/models\/.*\.ts$/,
				plugins: [
					['@babel/plugin-proposal-decorators', { legacy: true }],
					['@babel/plugin-proposal-class-properties', { loose: true }],
				],
			},
		],
	};
};