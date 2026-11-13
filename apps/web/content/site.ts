import { locales, slugs, type Locale, type Slug } from "@lanafox/contracts";

export { locales, slugs, type Locale, type Slug };

export const site = {
  name: "Lana Fox",
  email: "contact@lanafox.eu",
  social: [
    { label: "Facebook", url: "https://www.facebook.com/lanafox.ph" },
    { label: "Instagram", url: "https://www.instagram.com/lanafox.ph" },
    { label: "Threads", url: "https://www.threads.net/@lanafox.ph" },
  ],
} as const;

export const copy = {
  en: {
    nav: ["About me", "Portfolio", "Contact"],
    photography: "Photography",
    intro:
      "Hey there! My name is Svitlana, and I’m a photographer passionate about photography, music, and programming.",
    portfolio: "Portfolio",
    contact: "Get in touch!",
    privacy: "Privacy policy",
    terms: "Terms and conditions",
    skip: "Skip to content",
    empty: "The gallery is being curated.",
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
    intro:
      "Привіт! Мене звати Світлана, і я фотограф. Захоплююсь фотографією, музикою та програмуванням.",
    portfolio: "Портфоліо",
    contact: "Зворотний зв’язок",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    skip: "Перейти до вмісту",
    empty: "Галерея готується до публікації.",
    name: "Ваше ім’я",
    email: "Ваша електронна адреса",
    message: "Повідомлення",
    send: "Надіслати",
    pending: "Надсилання…",
    success: "Дякую за Ваше повідомлення!",
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
