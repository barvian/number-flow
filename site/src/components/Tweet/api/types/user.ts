export interface TweetUser {
  id_str: string;
  name: string;
  profile_image_url_https: string;
  profile_image_shape: "Circle" | "Square";
  screen_name: string;
  verified: boolean;
  verified_type?: "Business" | "Government";
  is_blue_verified: boolean;
}
