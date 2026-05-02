export interface LastfmSimilarTrack {
  name: string
  artist: {
    name: string
    url: string
  }
  url: string
  image: Array<{
    '#text': string
    size: 'small' | 'medium' | 'large' | 'extralarge'
  }>
  match: number
}

export interface LastfmSimilarResponse {
  similartracks: {
    track: LastfmSimilarTrack[] | LastfmSimilarTrack
  }
}
