export interface Store {
  id: string;
  name: string;
  businessType: string;
  keywords: string[];
  reviewExpectations?: string[];
  googleUrl?: string;
  yelpUrl?: string;
  landing_page_count?: number;
}

export interface LandingPage {
  id: string;
  store_id: string;
  store_name: string;
  business_type: string;
  keywords: string[];
  review_expectations?: string[];
  google_url?: string;
  yelp_url?: string;
  cached_review?: string;
  cached_at?: string;
  view_count: number;
  copy_count: number;
}
