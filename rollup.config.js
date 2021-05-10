import typescript from 'rollup-plugin-typescript2';

export default {
	input: './src/index.ts',
	output: {
		file: './dist/vue.js',
		name: 'vue',
		format: 'iife'
	},
	plugins: [
		typescript()
	]
}
