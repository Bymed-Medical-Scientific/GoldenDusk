export type SubmitQuoteRequestItem = {
  productId: string;
  quantity: number;
};

export type SubmitQuoteRequest = {
  fullName: string;
  institution: string;
  email: string;
  phoneNumber: string;
  address: string;
  notes?: string;
  items: SubmitQuoteRequestItem[];
};
