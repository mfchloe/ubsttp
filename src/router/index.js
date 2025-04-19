import { createRouter, createWebHistory } from "vue-router";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

import HomeView from "@/views/HomeView.vue";
import SignUp from "@/views/SignUp.vue";
import SignIn from "@/views/SignIn.vue";
import ProfileView from "@/views/ProfileView.vue";
import LearningPath from "@/views/LearningPath.vue";
import NotFound from "@/views/NotFound.vue";

const routes = [
  { path: "/signup", name: "SignUp", component: SignUp },
  { path: "/signin", name: "SignIn", component: SignIn },
  {
    path: "/",
    name: "Home",
    component: HomeView,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: "/learning-path",
    name: "LearningPath",
    component: LearningPath,
    meta: { requiresAuth: true },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Firebase authentication check
const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Stop listening once we get the result
      resolve(user);
    });
  });
};

// Route guard: only allow access if logged in
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const currentUser = await getCurrentUser();

  if (requiresAuth && !currentUser) {
    next("/signin");
  } else {
    next();
  }
});

export default router;
