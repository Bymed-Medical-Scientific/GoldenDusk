"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm } from "@/lib/api/contact";
import { ApiError } from "@/lib/api/http";
import { validateEmail } from "@/lib/auth/credentials-validation";
import {
  siteFooterContact,
  siteFooterMailtoHref,
  siteFooterTelHref,
} from "@/lib/site-contact";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Name is required.";
  if (trimmed.length > 100) return "Name must not exceed 100 characters.";
  return null;
}

function validateSubject(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Subject is required.";
  if (trimmed.length > 200) return "Subject must not exceed 200 characters.";
  return null;
}

function validateMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Message is required.";
  if (trimmed.length > 5000) return "Message must not exceed 5000 characters.";
  return null;
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const nameError = validateName(form.name);
  const emailError = validateEmail(form.email);
  const subjectError = validateSubject(form.subject);
  const messageError = validateMessage(form.message);

  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (subjectError) errors.subject = subjectError;
  if (messageError) errors.message = messageError;

  return errors;
}

function toValidationErrors(error: ApiError): FormErrors {
  const errors: FormErrors = {};
  for (const issue of error.validationIssues ?? []) {
    const field = issue.propertyName.toLowerCase();
    if (field === "name") errors.name = issue.errorMessage;
    if (field === "email") errors.email = issue.errorMessage;
    if (field === "subject") errors.subject = issue.errorMessage;
    if (field === "message") errors.message = issue.errorMessage;
  }
  return errors;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusError(null);
    setStatusSuccess(null);

    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      await submitContactForm({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setStatusSuccess("Your message has been sent successfully.");
      setFieldErrors({});
      setForm(initialForm);
    } catch (error) {
      if (error instanceof ApiError) {
        const apiErrors = toValidationErrors(error);
        if (Object.keys(apiErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...apiErrors }));
          setStatusError("Please fix the highlighted fields and try again.");
        } else {
          setStatusError(error.message);
        }
      } else {
        setStatusError(
          "We could not send your message. Please try again shortly.",
        );
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1fr_380px] lg:gap-14 lg:py-16">
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Get in touch
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground sm:text-lg">
          Send us your questions and we will get back to you as soon as
          possible.
        </p>

        <Card className="mt-10 border-border/80 shadow-premium-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg">Message</CardTitle>
            <CardDescription>
              All fields are required. We typically respond within one business
              day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={
                    fieldErrors.name ? "contact-name-error" : undefined
                  }
                />
                {fieldErrors.name ? (
                  <p
                    id="contact-name-error"
                    className="text-xs text-destructive"
                  >
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "contact-email-error" : undefined
                  }
                />
                {fieldErrors.email ? (
                  <p
                    id="contact-email-error"
                    className="text-xs text-destructive"
                  >
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.subject)}
                  aria-describedby={
                    fieldErrors.subject ? "contact-subject-error" : undefined
                  }
                />
                {fieldErrors.subject ? (
                  <p
                    id="contact-subject-error"
                    className="text-xs text-destructive"
                  >
                    {fieldErrors.subject}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  rows={6}
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={
                    fieldErrors.message ? "contact-message-error" : undefined
                  }
                  className="min-h-[140px] resize-y"
                />
                {fieldErrors.message ? (
                  <p
                    id="contact-message-error"
                    className="text-xs text-destructive"
                  >
                    {fieldErrors.message}
                  </p>
                ) : null}
              </div>

              {statusSuccess ? (
                <p
                  className="text-sm text-teal dark:text-teal-muted"
                  role="status"
                >
                  {statusSuccess}
                </p>
              ) : null}
              {statusError ? (
                <p className="text-sm text-destructive" role="alert">
                  {statusError}
                </p>
              ) : null}

              <Button type="submit" disabled={pending} className="min-w-[9rem]">
                {pending ? "Sending…" : "Send message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <aside className="lg:pt-14">
        <Card className="border-border/80 bg-gradient-to-b from-card to-muted/20 shadow-premium-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Contact information
            </CardTitle>
            <CardDescription>
              Prefer email or phone? Reach us directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="flex gap-3">
              <Mail
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <p className="font-medium text-foreground">Email</p>
                <a
                  href={siteFooterMailtoHref}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {siteFooterContact.email}
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <p className="font-medium text-foreground">Phone</p>
                <a
                  href={siteFooterTelHref}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {siteFooterContact.phoneDisplay}
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <p className="font-medium text-foreground">Hours</p>
                <p className="text-muted-foreground">
                  {siteFooterContact.hoursLine}
                </p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-border pt-5">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <p className="font-medium text-foreground">Address</p>
                <address className="not-italic text-muted-foreground">
                  ByMed Medical &amp; Scientific
                  <br />
                  12 Healthway Avenue
                  <br />
                  Harare, Zimbabwe
                </address>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
