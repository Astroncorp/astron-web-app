import { defineStore } from "pinia";

type ProPermissions = {
  show_ads: boolean;
  view_topic_test_results: boolean;
  access_mixed_test: boolean;
  access_mixedsubject_test: boolean;
};

type ProStatusResponse = {
  is_pro: boolean;
  expires_at: string | null;
  permissions: ProPermissions;
};

const defaultProPermissions = (): ProPermissions => ({
  show_ads: true,
  view_topic_test_results: false,
  access_mixed_test: false,
  access_mixedsubject_test: false,
});

export const useUserStore = defineStore("user", {
  state: (): {
    token: string;
    id: string | number;
    balance: string;
    isPro: boolean;
    proExpiresAt: string | null;
    proPermissions: ProPermissions;
    proStatusChecked: boolean;
  } => ({
    token: "",
    id: "",
    balance: "",

    // Astron PRO
    isPro: false,
    proExpiresAt: null,
    proPermissions: defaultProPermissions(),
    proStatusChecked: false,
  }),

  actions: {
    setToken(token: string) {
      this.token = token;
    },

    setId(id: string | number) {
      this.id = id;
    },

    setBalance(value: string) {
      this.balance = value;
    },

    // PRO tekshiruvi boshlanishidan oldin
    resetProStatus() {
      this.isPro = false;
      this.proExpiresAt = null;
      this.proPermissions = defaultProPermissions();
      this.proStatusChecked = false;
    },

    // prostatus.php javobini saqlash
    setProStatus(data: ProStatusResponse) {
      this.isPro = data.is_pro === true;
      this.proExpiresAt = this.isPro
        ? data.expires_at
        : null;

      this.proPermissions = this.isPro
        ? {
            show_ads: false,
            view_topic_test_results: true,
            access_mixed_test: true,
            access_mixedsubject_test: true,
          }
        : defaultProPermissions();

      this.proStatusChecked = true;
    },
  },
});
