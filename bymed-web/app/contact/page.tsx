"use client";

import { submitContactForm } from "@/lib/api/contact";
import { ApiError } from "@/lib/api/http";
import { siteFooterContact, siteFooterMailtoHref, siteFooterTelHref } from "@/lib/site-contact";
import { validateEmail } from "@/lib/auth/credentials-validation";
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
        setStatusError("We could not send your message. Please try again shortly.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-2 text-muted-foreground">
          Send us your questions and we will get back to you as soon as possible.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <label className="block text-sm">
            <span className="text-foreground">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
            {fieldErrors.name ? (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
                {fieldErrors.name}
              </span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="text-foreground">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
            {fieldErrors.email ? (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
                {fieldErrors.email}
              </span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="text-foreground">Subject</span>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              aria-invalid={Boolean(fieldErrors.subject)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
            {fieldErrors.subject ? (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
                {fieldErrors.subject}
              </span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="text-foreground">Message</span>
            <textarea
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
              rows={6}
              aria-invalid={Boolean(fieldErrors.message)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
            {fieldErrors.message ? (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
                {fieldErrors.message}
              </span>
            ) : null}
          </label>

          {statusSuccess ? (
            <p className="text-sm text-green-700 dark:text-green-400" role="status">
              {statusSuccess}
            </p>
          ) : null}
          {statusError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {statusError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] disabled:opacity-60"
          >
            {pending ? "Sending..." : "Send message"}
          </button>
        </form>
      </section>

      <aside className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="block text-foreground">Email</span>
            <a href={siteFooterMailtoHref} className="hover:text-brand hover:underline">
              {siteFooterContact.email}
            </a>
          </li>
          <li>
            <span className="block text-foreground">Phone</span>
            <a href={siteFooterTelHref} className="hover:text-brand hover:underline">
              {siteFooterContact.phoneDisplay}
            </a>
          </li>
          <li>
            <span className="block text-foreground">Address</span>
            <address className="not-italic">
              ByMed Medical &amp; Scientific
              <br />
              12 Healthway Avenue
              <br />
              Harare, Zimbabwe
            </address>
          </li>
        </ul>
      </aside>
    </div>
  );
}
