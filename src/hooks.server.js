import { VITE_8THWALL_API_KEY } from '$env/static/private';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			// Replace the placeholder with the actual script tag
			return html.replace(
				'<!-- 8THWALL_SCRIPT_PLACEHOLDER -->',
				`<script async src="//apps.8thwall.com/xrweb?appKey=${VITE_8THWALL_API_KEY}"></script>`
			);
		}
	});

	return response;
}