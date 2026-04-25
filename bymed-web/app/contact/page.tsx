"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listCategories } from "@/lib/api/categories";
import { submitContactForm } from "@/lib/api/contact";
import { ApiError } from "@/lib/api/http";
import { validateEmail } from "@/lib/auth/credentials-validation";
import type { CategoryDto } from "@/types/category";
import {
  siteFooterContact,
  siteFooterMailtoHref,
  siteFooterTelHref,
} from "@/lib/site-contact";
import {
  Beaker,
  Clock,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

type FormState = {
  name: string;
  email: string;
  organization: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  name: "",
  email: "",
  organization: "",
  subject: "",
  message: "",
};

const fallbackInterestOptions = ["General inquiry"] as const;

function ContactItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

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

function validateOrganization(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length > 200) {
    return "Organization must not exceed 200 characters.";
  }
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
  const organizationError = validateOrganization(form.organization);
  const subjectError = validateSubject(form.subject);
  const messageError = validateMessage(form.message);

  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (organizationError) errors.organization = organizationError;
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
    if (field === "organization") errors.organization = issue.errorMessage;
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
  const [interestOptions, setInterestOptions] = useState<string[]>([]);
  const [isOptionsReady, setIsOptionsReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const categories = await listCategories();
        if (!active) return;
        const ordered = [...categories]
          .sort(
            (a: CategoryDto, b: CategoryDto) =>
              a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
          )
          .map((category) => category.name.trim())
          .filter((name) => name.length > 0);
        setInterestOptions(
          ordered.length > 0
            ? [...ordered, ...fallbackInterestOptions]
            : [...fallbackInterestOptions],
        );
        setIsOptionsReady(true);
      } catch {
        if (active) {
          setInterestOptions([...fallbackInterestOptions]);
          setIsOptionsReady(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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
        organization: form.organization.trim(),
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
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16 [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading">
      <section className="max-w-4xl">
        <h1 className="font-heading text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Connect with Bymed <span className="text-primary">Scientific</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Expert consultation for clinical laboratories, research institutions,
          and medical facilities. Reach out to our scientific specialists for
          precise equipment solutions.
        </p>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Request a Quote
          </h2>
          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Full name</Label>
                <Input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  autoComplete="name"
                  placeholder="Dr. Sarah Jenkins"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={
                    fieldErrors.name ? "contact-name-error" : undefined
                  }
                  className="h-11 rounded-xl bg-muted/35"
                />
                {fieldErrors.name ? (
                  <p id="contact-name-error" className="text-xs text-destructive">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Work email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  autoComplete="email"
                  placeholder="s.jenkins@medical.org"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "contact-email-error" : undefined
                  }
                  className="h-11 rounded-xl bg-muted/35"
                />
                {fieldErrors.email ? (
                  <p id="contact-email-error" className="text-xs text-destructive">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-organization">Organization</Label>
                <Input
                  id="contact-organization"
                  type="text"
                  value={form.organization}
                  onChange={(e) => updateField("organization", e.target.value)}
                  placeholder="Central Research Hospital"
                  aria-invalid={Boolean(fieldErrors.organization)}
                  aria-describedby={
                    fieldErrors.organization ? "contact-organization-error" : undefined
                  }
                  className="h-11 rounded-xl bg-muted/35"
                />
                {fieldErrors.organization ? (
                  <p id="contact-organization-error" className="text-xs text-destructive">
                    {fieldErrors.organization}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Equipment interest</Label>
                <select
                  id="contact-subject"
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.subject)}
                  aria-describedby={
                    fieldErrors.subject ? "contact-subject-error" : undefined
                  }
                  className="h-11 w-full rounded-xl border border-input bg-muted/35 px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <option value="">Select category</option>
                  {isOptionsReady
                    ? interestOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))
                    : null}
                </select>
                {fieldErrors.subject ? (
                  <p id="contact-subject-error" className="text-xs text-destructive">
                    {fieldErrors.subject}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Detailed message</Label>
              <Textarea
                id="contact-message"
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                rows={5}
                placeholder="Briefly describe your requirements or technical specifications..."
                aria-invalid={Boolean(fieldErrors.message)}
                aria-describedby={
                  fieldErrors.message ? "contact-message-error" : undefined
                }
                className="min-h-[140px] resize-y rounded-2xl bg-muted/35"
              />
              {fieldErrors.message ? (
                <p id="contact-message-error" className="text-xs text-destructive">
                  {fieldErrors.message}
                </p>
              ) : null}
            </div>

            {statusSuccess ? (
              <p className="text-sm text-teal dark:text-teal-muted" role="status">
                {statusSuccess}
              </p>
            ) : null}
            {statusError ? (
              <p className="text-sm text-destructive" role="alert">
                {statusError}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={pending}
              className="h-11 w-full rounded-full text-sm font-semibold"
            >
              {pending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl bg-muted/40 px-4 py-3">
              <Clock className="mt-0.5 size-4 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-foreground">Rapid response</p>
                <p className="text-xs text-muted-foreground">
                  Our specialist teams respond within 24 hours to all scientific
                  inquiries.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-muted/40 px-4 py-3">
              <ShieldCheck className="mt-0.5 size-4 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-foreground">Trusted globally</p>
                <p className="text-xs text-muted-foreground">
                  Partnered with over 500 research institutions and hospitals.
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Bymed Medical & Scientific HQ
            </h2>
            <div className="mt-6 space-y-5">
              <ContactItem icon={MapPin} label="Address">
                <address className="not-italic text-muted-foreground">
                  ByMed Medical &amp; Scientific
                  <br />
                  12 Healthway Avenue, Harare
                  <br />
                  Zimbabwe
                </address>
              </ContactItem>

              <ContactItem icon={Phone} label="Clinical support">
                <a
                  href={siteFooterTelHref}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {siteFooterContact.phoneDisplay}
                </a>
              </ContactItem>

              <ContactItem icon={Mail} label="Inquiries">
                <a
                  href={siteFooterMailtoHref}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {siteFooterContact.email}
                </a>
              </ContactItem>
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-muted/35 p-4">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
              <iframe
                title="ByMed location map"
                className="h-56 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Bulawayo,+Zimbabwe&output=embed"
              />
            </div>
            <a
              href="https://maps.google.com/?q=Bulawayo,+Zimbabwe"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center justify-center rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-muted"
            >
              View in Google Maps
            </a>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Connect digitally
            </p>
            <div className="mt-3 flex items-center gap-2">
              <a
                href={siteFooterMailtoHref}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Email"
              >
                <Mail className="size-4" aria-hidden />
              </a>
              <a
                href={siteFooterTelHref}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Phone"
              >
                <Phone className="size-4" aria-hidden />
              </a>
              <a
                href="https://bymed.co.zw/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Website"
              >
                <Globe2 className="size-4" aria-hidden />
              </a>
              <a
                href="/products"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Catalog"
              >
                <Beaker className="size-4" aria-hidden />
              </a>
              <a
                href="/"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Share home page"
              >
                <Share2 className="size-4" aria-hidden />
              </a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
