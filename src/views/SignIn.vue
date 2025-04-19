<template>
    <v-container fluid>
      <v-row>
        <!-- Left side: Full-Height Image -->
        <v-col cols="12" md="6" class="study-image" :style="{ backgroundImage: 'url(/Study.png)' }" ></v-col>
  
        <!-- Right side: Sign In Form -->
        <v-col cols="12" md="6" class="d-flex align-center justify-center">
          <v-form @submit.prevent="handleSubmit" class="form-container">
            <h2 class="text-h5 font-weight-bold text-left">Sign in</h2>
  
            <v-text-field
              v-model="email"
              label="Email Address"
              type="email"
              required
              variant="outlined"
              density="comfortable"
              class="custom-input"
            />
  
            <v-text-field
              v-model="password"
              label="Password"
              :type="passwordVisible ? 'text' : 'password'"
              :append-inner-icon="passwordVisible ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="togglePasswordVisibility"
              required
              variant="outlined"
              density="comfortable"
              class="custom-input"
              append-inner-icon-style="color: primary"
            />
  
            <div class="forgot-password">
              <a href="#" class="text-decoration-none" @click.prevent="forgotDialog = true">
                Forgot password?
              </a>
            </div>
  
            <CustomButton :color="'primary'" :block="true" @click="handleSubmit">
              Sign in
            </CustomButton>
  
            <div class="login-link">
              <span>
                Don't have an account?
                <router-link to="/signup" class="create-account">Create one</router-link>
              </span>
            </div>
          </v-form>
        </v-col>
      </v-row>
    </v-container>
  
    <!-- Forgot Password Dialog -->
    <v-dialog v-model="forgotDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Reset Password</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="resetEmail"
            label="Email Address"
            type="email"
            required
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="grey" text @click="forgotDialog = false" rounded="xl">Cancel</v-btn>
          <v-btn color="primary" @click="sendResetEmail" rounded="xl">
            Send Reset Email
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script>
  import CustomButton from "@/components/CustomButton.vue";
  import { auth, firestore } from "@/firebase";
  import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
  import { collection, query, where, getDocs } from "firebase/firestore";
  
  export default {
    components: { CustomButton },
    data() {
      return {
        email: "",
        password: "",
        passwordVisible: false,
        forgotDialog: false,
        resetEmail: "",
      };
    },
    methods: {
      async handleSubmit() {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
          const user = userCredential.user;
  
          if (!user.emailVerified) {
            alert("Please verify your email before signing in.");
            return;
          }
  
          console.log("User signed in", user.uid);
          this.$router.push("/");
        } catch (error) {
          console.error("Error signing in", error.code);
          switch (error.code) {
            case "auth/user-not-found":
              alert("User not found. Please sign up.");
              break;
            case "auth/wrong-password":
              alert("Wrong password. Please try again.");
              break;
            default:
              alert("An error occurred. Please try again.");
          }
        }
      },
      togglePasswordVisibility() {
        this.passwordVisible = !this.passwordVisible;
      },
      async sendResetEmail() {
        if (!this.resetEmail) {
          alert("Please enter your email address.");
          return;
        } else if (!this.resetEmail.includes("@")) {
          alert("Please enter a valid email address.");
          return;
        }
        try {
          const usersRef = collection(firestore, "users");
          const q = query(usersRef, where("email", "==", this.resetEmail));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            alert("No account found with that email.");
            this.resetEmail = "";
            return;
          }
          await sendPasswordResetEmail(auth, this.resetEmail);
          console.log("Trying to send reset email to:", this.resetEmail);
          alert("Password reset email sent. Please check your inbox.");
          this.forgotDialog = false;
          this.resetEmail = "";
        } catch (error) {
          console.error("Reset error:", error);
          switch (error.code) {
            case "auth/user-not-found":
              alert("No user found with this email.");
              break;
            case "auth/invalid-email":
              alert("Invalid email address.");
              break;
            default:
              alert("An error occurred. Please try again.");
          }
        }
      }
    },
  };
  </script>
  
  <style scoped>
  .study-image {
    background-size: cover;
    background-position: center;
    height: 100vh;
  }
  
  .form-container {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .custom-input {
    background-color: transparent !important;
  }
  
  .forgot-password {
    text-align: right;
    margin-bottom: 8px;
  }
  
  .login-link {
    margin-top: 16px;
    text-align: left;
  }
  
  .create-account {
    color: #007bff;
    text-decoration: underline;
  }
  </style>
  