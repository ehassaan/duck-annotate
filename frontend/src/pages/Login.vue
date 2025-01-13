<template>
    <div :class="$style.container">



        <v-snackbar v-model="showMessage" :timeout="6000">
            {{ message }}
        </v-snackbar>

        <div :class="$style.cards_container">
            <div :class="$style.hero">
                <img src="/public/logos/dl_dark.png">
                <!-- <h1 :class="$style.logo">Duck Annotate</h1> -->
                <!-- <Logo :class="$style.logo"></Logo> -->

                <h1 :class="$style.tagline">Are you ready to quack?</h1>
            </div>
            <v-card :class="$style.auth_card" flat :elevation="10" color="secondary">

                <v-tabs v-model="tab" grow>
                    <v-tab value="login">
                        Login
                    </v-tab>
                    <v-tab value="signup">
                        Sign Up
                    </v-tab>
                </v-tabs>


                <v-window v-model="tab">
                    <v-window-item value="login" :class="$style.window">
                        <v-form @submit.prevent="login" :class="$style.form">

                            <v-text-field :rules="[validateEmail]" required :class="$style.input_field" type="email"
                                v-model="email" label="Email"></v-text-field>
                            <v-text-field required :rules="[validatePassword]" :class="$style.input_field"
                                type="password" v-model="password" label="Password"></v-text-field>

                            <a :class="$style.forgot" href="#">Forgot Password</a>

                            <v-btn :class="$style.btn_login" type="submit" :loading="isLoading">Login</v-btn>

                            <p :class="$style.separator">or sign in with</p>

                            <div :class="$style.social_buttons">
                                <v-btn :loading="isLoadingSocial" prepend-icon="mdi-github"
                                    @click="() => loginSocial('github')">
                                    Continue with github
                                </v-btn>
                            </div>
                        </v-form>

                    </v-window-item>
                    <v-window-item value="signup" :class="$style.window">
                        <v-form :class="$style.form" @submit.prevent="signup">

                            <v-text-field required :rules="[validateName]" :class="$style.input_field" v-model="name"
                                label="Name"></v-text-field>
                            <v-text-field required :rules="[validateEmail]" :class="$style.input_field" type="email"
                                v-model="email" label="Email"></v-text-field>
                            <v-text-field required :rules="[validatePassword]" :class="$style.input_field"
                                type="password" v-model="password" label="Password"></v-text-field>

                            <v-btn :class="$style.btn_login" :loading="isLoading" type="submit">Sign Up</v-btn>

                            <p :class="$style.separator">or sign in with</p>

                            <div :class="$style.social_buttons">
                                <v-btn :loading="isLoadingSocial" prepend-icon="mdi-github" type="submit"
                                    @click="() => loginSocial('github')">
                                    Continue with github
                                </v-btn>
                            </div>
                        </v-form>

                    </v-window-item>
                </v-window>

            </v-card>

        </div>
    </div>
</template>

<script lang="ts" setup>
import Logo from '@/components/Logo.vue';
import { authClient, signinSocial } from '@/services/auth';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { SubmitEventPromise } from 'vuetify';

const tab = ref("login");
const name = ref("");
const email = ref("");
const password = ref("");
const message = ref("");
const showMessage = ref(false);
const isLoading = ref(false);
const isLoadingSocial = ref(false);
const router = useRouter();

onMounted(async () => {
    try {
        const session = await authClient.getSession();
        if (!session.error && session.data) {
            console.log("Session: ", session);
            router.replace("/");
        }
    }
    catch (err) {
        console.error("Failed to get session: ", err);
    }
});


function validateEmail(val: string) {
    const match = val.match(/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/);
    if (match) return true;
    return "Please enter a valid email address";
}

function validateName(val: string) {
    if (val && val.length > 4) {
        return true;
    }
    else return "Please enter a valid name";
}

function validatePassword(val: string) {
    if (val && val.length >= 8) return true;
    else return "Password must be at-least 8 characters";
}

async function login(ev: SubmitEventPromise) {
    const validation = await ev;
    if (!validation.valid) return;
    try {
        isLoading.value = true;
        const res = await authClient.signIn.email({
            email: email.value,
            password: password.value,
            // callbackURL: import.meta.env.VITE_BASE_URL
        });
        if (res.error) throw Error(res.error.message);
        await router.replace("/");
    }
    catch (err) {
        console.log("Error logging in: ", err);
        message.value = "Error: " + err;
        showMessage.value = true;
    }
    finally {
        isLoading.value = false;
    }
}

async function signup(ev: SubmitEventPromise) {
    const validation = await ev;
    if (!validation.valid) return;
    try {
        isLoading.value = true;
        const res = await authClient.signUp.email({
            name: name.value,
            email: email.value,
            password: password.value,
            // callbackURL: import.meta.env.VITE_BASE_URL
        });
        if (res.error) throw Error(res.error.message);
        router.replace("/");
    }
    catch (err) {
        console.log("Error sign up: ", err);
        message.value = "Error: " + err;
        showMessage.value = true;
    }
    finally {
        isLoading.value = false;
    }
}

async function loginSocial(provider: string) {
    isLoadingSocial.value = true;
    try {
        const res = await signinSocial(provider);
        if (res.error) throw Error(res.error.message);
        router.replace("/");
    }
    catch (err) {
        console.log("Error logging in: ", err);
        message.value = "Error: " + err;
        showMessage.value = true;
    }
    finally {
        isLoadingSocial.value = false;
    }
}

</script>

<style module>
.container {
    height: 100vh;
    width: 100vw;
    display: flex;
}

.cards_container {
    display: flex;
    margin: auto;
    justify-content: center;
    align-items: stretch;
    width: 70%;
    flex-direction: row;
    /* background-color: #0009; */

    /* background: hsla(33, 84%, 68%, 1); */

    /* background-blend-mode: multiply;
    background-size: cover;
    background-image: linear-gradient(130deg,
            hsla(33, 84%, 68%, 1) 0%,
            hsla(184, 51%, 27%, 1) 52%,
            hsla(191, 96%, 18%, 1) 100%),
        url("/public/images/ducklake-bg.jpg"); */
}

.hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 400px;
    /* margin-bottom: 30px; */
    background-color: rgb(var(--v-theme-surface));
    background-color: black;
}

.hero img {
    height: 90px;
    margin-bottom: 25px;
    margin-right: 10px;
    /* opacity: 0.8; */
}

.tagline {
    color: rgb(var(--theme-color-secondary));
    /* color: white; */
    margin: auto;
    text-align: center;
    margin: 50px 0 0 0;
    font-weight: 100;
    font-size: 20px;
    font-family: 'Open Sans', sans-serif;
}

.logo {
    font-size: 30px;
    font-family: 'MontserratAlt1-Light', sans-serif;
    /* color: #fff; */
    text-transform: uppercase;
}

.auth_card {
    /* flex: 1; */
    margin: 0 50px 0 0;
    width: 40%;
    min-width: 400px;
    border-radius: 0;
    background-color: #024a5a44;
    /* background-color: #0000; */
    /* background-color: rgb(var(--v-theme-secondary)) */
    /* background-image: linear-gradient(130deg,
            rgba(242, 180, 105, 0.516) 0%,
            hsla(184, 51%, 27%, 1) 52%,
            hsla(191, 96%, 18%, 1) 100%) */
}

.btn_login {
    margin: 0 0 20px 0;
    /* max-width: 250px; */
}

.input_field {}

.social_buttons {
    display: flex;
    flex-direction: column;
    max-width: 250px;
    align-self: center;
    align-items: center;
    margin-top: 20px;
}

.separator {
    font-size: 12px;
    width: 100%;
    text-align: center;
}

.window {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 40px;
}

.form {
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

.forgot {
    margin: 0 0 20px 0;
    font-size: 12px;
    text-align: right;
    font-weight: bold;
}
</style>