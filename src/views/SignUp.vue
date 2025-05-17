<template>
  <v-container fluid>
    <v-row>
      <!-- Left side: Image -->
      <v-col
        cols="12"
        md="6"
        class="study-image"
        :style="{ backgroundImage: 'url(/Study.png)' }"
      ></v-col>

      <!-- Right side: Sign Up Form -->
      <v-col cols="12" md="6" class="d-flex align-center justify-center">
        <v-form @submit.prevent="handleSubmit" class="form-container">
          <h2 class="text-h5 font-weight-bold text-left">Join EmpowHer</h2>

          <v-text-field
            v-model="name"
            label="Full Name"
            required
            variant="outlined"
            density="comfortable"
            class="custom-input"
          />

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
          />

          <v-text class="password-info">
            Use 8 or more characters with a mix of letters, numbers & symbols
          </v-text>

          <v-select
            v-model="careerStage"
            :items="careerStageOptions"
            label="Career Stage"
            required
            variant="outlined"
            density="comfortable"
            class="custom-input"
          />

          <v-select
            v-model="skills"
            :items="skillOptions"
            label="Skills"
            multiple
            chips
            clearable
            required
            variant="outlined"
            class="custom-input"
          />

          <v-combobox
            v-model="goals"
            label="Goals"
            multiple
            chips
            clearable
            placeholder="e.g., Career Growth, Networking, Mentorship"
            variant="outlined"
            class="custom-input"
          />

          <v-text-field
            v-model.number="availableTime"
            label="Available Time (hours per day)"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            class="custom-input"
          />

          <CustomButton :color="'primary'" :block="true" @click="handleSubmit">
            Create an account
          </CustomButton>

          <div class="login-link">
            <span>
              Already have an account?
              <router-link to="/signin" class="login-text">Log in</router-link>
            </span>
          </div>
        </v-form>
      </v-col>
    </v-row>

    <!-- Success Alert -->
    <v-alert
      v-if="showSuccessAlert"
      type="success"
      variant="elevated"
      prominent
      closable
      class="success-alert"
    >
      <div>
        <span v-if="!isLoading">
          Verification email sent! Please check your inbox and sign in again.
        </span>
        <v-progress-circular
          indeterminate
          color="primary"
          size="24"
          class="mt-2 d-block mx-auto"
        ></v-progress-circular>
      </div>
    </v-alert>
  </v-container>
</template>

<script>
import CustomButton from "@/components/CustomButton.vue";
import { auth, firestore } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default {
  components: { CustomButton },
  data() {
    return {
      name: "",
      email: "",
      password: "",
      careerStage: "",
      skills: [],
      goals: [],
      availableTime: 0,
      passwordVisible: false,
      showSuccessAlert: false,
      careerStageOptions: [
        "Student",
        "Early Career",
        "Mid Career",
        "Senior Career",
        "Executive",
        "Career Switcher",
      ],
      skillOptions: [
        // Frontend
        "HTML",
        "CSS",
        "JavaScript",
        "TypeScript",
        "React",
        "Vue",
        "Angular",
        "Tailwind CSS",
        "Bootstrap",

        // Backend
        "Node.js",
        "Express",
        "Python",
        "Flask",
        "Django",
        "Java",
        "Spring",
        "C#",
        ".NET",
        "Go",
        "PHP",

        // Databases
        "SQL",
        "MySQL",
        "PostgreSQL",
        "MongoDB",
        "Firebase",
        "Redis",

        // DevOps / Tools
        "Git",
        "GitHub",
        "Docker",
        "Kubernetes",
        "CI/CD",
        "Jenkins",
        "Linux",
        "Bash",
        "AWS",
        "GCP",
        "Azure",

        // Data Science / ML
        "Machine Learning",
        "Deep Learning",
        "Pandas",
        "NumPy",
        "TensorFlow",
        "PyTorch",
        "Scikit-learn",
        "Data Visualization",
        "Data Cleaning",
        "Big Data",

        // Cybersecurity
        "Network Security",
        "Ethical Hacking",
        "Penetration Testing",
        "Cryptography",
        "OWASP",

        // Design / UX
        "UI Design",
        "UX Design",
        "Design Thinking",
        "Figma",
        "Canva",
        "User Research",
        "Wireframing",
        "Prototyping",

        // Mobile Dev
        "React Native",
        "Flutter",
        "Swift",
        "Kotlin",
        "Android Studio",
        "iOS Development",

        // Project / Soft Skills
        "Project Management",
        "Agile",
        "Scrum",
        "Communication",
        "Teamwork",
        "Public Speaking",
        "Problem Solving",
      ],
    };
  },
  methods: {
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },
    async handleSubmit() {
      const passwordStrengthRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
      if (!passwordStrengthRegex.test(this.password)) {
        alert(
          "Password must be at least 8 characters long and include letters, numbers, and symbols."
        );
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          this.email,
          this.password
        );
        const user = userCredential.user;

        // Save user data to Firestore
        await setDoc(doc(firestore, "users", user.uid), {
          name: this.name,
          email: this.email,
          userID: user.uid,
          careerStage: this.careerStage,
          skills: this.skills,
          goals: this.goals,
          availableTime: this.availableTime,
          createdAt: serverTimestamp(),
        });

        await sendEmailVerification(user);
        this.showSuccessAlert = true;

        setTimeout(() => {
          this.$router.push("/signin");
        }, 3000);
      } catch (error) {
        console.error("Sign Up Error", error);
      }
    },
  },
};
</script>

<style scoped>
.study-image {
  background-size: cover;
  background-position: center;
  height: 100vh;
  width: 100%;
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

.password-info {
  font-size: 12px;
  color: gray;
  text-align: left;
  margin-top: 0px;
}

.login-link {
  margin-top: 16px;
  text-align: left;
}

.login-text {
  color: #007bff;
  text-decoration: underline;
}

.success-alert {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 400px;
  z-index: 999;
}
</style>
