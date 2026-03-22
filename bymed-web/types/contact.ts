export type ContactFormDto = {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAtUtc: string;
};

export type SubmitContactFormRequest = {
  name: string;
  email: string;
  subject: string;
  message: string;
};
