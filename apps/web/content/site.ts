import { locales, slugs, type Locale, type Slug } from "@lanafox/contracts";

export { locales, slugs, type Locale, type Slug };

export const site = {
  name: "Lana Fox",
  email: "contact@lanafox.eu",
  phone: "+380987034015",
  contentReviewRequired: true,
  social: [
    { label: "Facebook", url: "https://www.facebook.com/lanafox.ph" },
    { label: "Pinterest", url: "https://www.pinterest.com/lanafox_ph" },
    { label: "Instagram", url: "https://www.instagram.com/lanafox.ph" },
    { label: "Twitter", url: "https://twitter.com/lanafox_ph" },
  ],
} as const;

export const copy = {
  en: {
    nav: ["About me", "Portfolio", "Contact"],
    photography: "Photography",
    heading: "Lana Fox",
    intro:
      "Hey there! My name is Svitlana. I’m passionate about photography, music, and programming.",
    portfolio: "Portfolio",
    contact: "Get in touch!",
    privacy: "Privacy policy",
    terms: "Terms and conditions",
    skip: "Skip to content",
    empty: "The gallery is being curated.",
    policy: "This page is awaiting owner review before public launch.",
    name: "Your name",
    email: "Your email",
    message: "Message",
    send: "Send message",
    pending: "Sending…",
    success: "Thank you for your message!",
    error: "We could not process your request. Please try again or email us.",
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
  },
  uk: {
    nav: ["Про мене", "Портфоліо", "Контакти"],
    photography: "Фотографія",
    heading: "Lana Fox",
    intro:
      "Привіт! Мене звати Світлана. Захоплююсь фотографією, музикою та програмуванням.",
    portfolio: "Портфоліо",
    contact: "Зворотній зв’язок",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    skip: "Перейти до вмісту",
    empty: "Галерея готується до публікації.",
    policy: "Ця сторінка очікує перевірки власником перед публікацією.",
    name: "Ваше ім’я",
    email: "Ваша електронна адреса",
    message: "Повідомлення",
    send: "Надіслати",
    pending: "Надсилання…",
    success: "Спасибі за Ваше повідомлення!",
    error:
      "Не вдалося обробити запит. Спробуйте ще раз або напишіть нам.",
    close: "Закрити",
    previous: "Попереднє фото",
    next: "Наступне фото",
  },
} as const;

export function href(locale: Locale, slug: string = "") {
  return `/${locale}/${slug ? slug + "/" : ""}`;
}

