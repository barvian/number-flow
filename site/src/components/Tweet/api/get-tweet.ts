import type { Tweet } from './types/index.js'

const SYNDICATION_URL = 'https://cdn.syndication.twimg.com'

export class TwitterApiError extends Error {
	status: number
	data: any

	constructor({ message, status, data }: { message: string; status: number; data: any }) {
		super(message)
		this.name = 'TwitterApiError'
		this.status = status
		this.data = data
	}
}

const TWEET_ID = /^[0-9]+$/

function getToken(id: string) {
	return ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(0+|\.)/g, '')
}

/**
 * Fetches a tweet from the Twitter syndication API.
 */
export async function getTweet(id: string, fetchOptions?: RequestInit): Promise<Tweet> {
	if (id.length > 40 || !TWEET_ID.test(id)) {
		throw new Error(`Invalid tweet id: ${id}`)
	}

	const url = new URL(`${SYNDICATION_URL}/tweet-result`)

	url.searchParams.set('id', id)
	url.searchParams.set('lang', 'en')
	url.searchParams.set(
		'features',
		[
			'tfw_timeline_list:',
			'tfw_follower_count_sunset:true',
			'tfw_tweet_edit_backend:on',
			'tfw_refsrc_session:on',
			'tfw_fosnr_soft_interventions_enabled:on',
			'tfw_show_birdwatch_pivots_enabled:on',
			'tfw_show_business_verified_badge:on',
			'tfw_duplicate_scribes_to_settings:on',
			'tfw_use_profile_image_shape_enabled:on',
			'tfw_show_blue_verified_badge:on',
			'tfw_legacy_timeline_sunset:true',
			'tfw_show_gov_verified_badge:on',
			'tfw_show_business_affiliate_badge:on',
			'tfw_tweet_edit_frontend:on'
		].join(';')
	)
	url.searchParams.set('token', getToken(id))

	const res = await fetch(url.toString(), fetchOptions)
	const isJson = res.headers.get('content-type')?.includes('application/json')
	const data = isJson ? await res.json() : undefined

	if (res.ok) return data
	if (res.status === 404) {
		throw new TwitterApiError({
			message: typeof data?.error === 'string' ? data.error : `Tweet ${id} not found.`,
			status: res.status,
			data
		})
	}

	throw new TwitterApiError({
		message: typeof data?.error === 'string' ? data.error : 'Bad request.',
		status: res.status,
		data
	})
}
