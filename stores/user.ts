import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
    state: (): { token: string; id: string | number; balance: string } => ({
        // token: "070d763b25160f7e5c94760e2ed319c48b0d7820b16984d9ad866255307dc99aae5016a88966452bb3846942cd4505523225",
        token: "",
        id: "",
        balance: "",
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
    },
});
