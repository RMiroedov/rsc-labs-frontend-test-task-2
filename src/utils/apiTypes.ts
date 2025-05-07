export interface JokeResponse {
  id: number;
  type: string;
  setup: string;
  punchline: string;
}

export interface RandomUser {
  name: { first: string; last: string };
  phone: string;
  picture: { medium: string };
}

export interface RandomUserResponse {
  results: RandomUser[];
}
