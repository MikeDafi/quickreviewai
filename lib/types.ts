export interface Store {
  id: string;
  name: string;
  address?: string;
  businessType: string; // Stored as comma-separated, but UI handles as array
  businessTypes?: string[]; // Convenience field for UI (up to 3)
  keywords: string[];
  reviewExpectations?: string[];
  googleUrl?: string;
  yelpUrl?: string;
  landing_page_count?: number;
  landing_page_id: string; // ID of the primary landing page
}

export interface LandingPage {
  id: string;
  store_id: string;
  store_name: string;
  business_type: string; // Can be comma-separated for multiple types
  keywords: string[];
  review_expectations?: string[];
  google_url?: string;
  yelp_url?: string;
  cached_review?: string;
  cached_at?: string;
  view_count: number;
  copy_count: number;
}
