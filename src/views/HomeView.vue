<template>
  <div class="home-container">
    <h1>Welcome to EmpowHer, {{ userName }}</h1>
    
    <v-container class="stats-container">
      <v-card class="stats-card pa-6" elevation="2">
        <div class="section-heading">Your Progress</div>
        <v-row>
          <!-- Left Section: Progress Overview -->
          <v-col cols="6">
            <v-card class="stat-box big-box" elevation="2">
              <v-card-text>
                <small>Modules Completed</small>
                <div class="stat-number">{{ modulesFinished }} / 5</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{width: `${progressPercentage}%`}"></div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Right Section: Achievements and Skills -->
          <v-col cols="6">
            <div class="right-column">
              <v-card class="stat-box small-box badges-box" elevation="2">
                <v-card-text>
                  <small>Badges Earned</small>
                  <div class="stat-number">{{ badgesCount }}</div>
                </v-card-text>
              </v-card>
              <v-card class="stat-box small-box skills-box" elevation="2">
                <v-card-text>
                  <small>Skills</small>
                  <div class="skills-list">{{ skillsList.join(", ") }}</div>
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-card>
      
      <!-- Recent Activity Section -->
      <v-card class="activity-card mt-4 pa-4" elevation="2">
        <div class="section-heading">Recent Activity</div>
        <div class="timeline">
          <div v-for="(activity, index) in recentActivities" :key="index" class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-date">{{ formatDate(activity.date) }}</div>
            </div>
          </div>
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { auth, firestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default {
  name: "HomeView",
  setup() {
    const userName = ref("User");
    const modulesFinished = ref(0);
    const badgesCount = ref(0);
    const skillsList = ref([]);
    const userID = ref("");
    
    const progressPercentage = computed(() => {
      return (modulesFinished.value / 5) * 100;
    });
    
    const recentActivities = ref([]);
    
    onMounted(async () => {
      // Get current user ID
      userID.value = auth.currentUser?.uid;
      
      if (!userID.value) return;
      
      // Fetch user data
      try {
        const userDoc = await getDoc(doc(firestore, "users", userID.value));
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Update user info
          userName.value = data.name || "User";
          modulesFinished.value = data.modulesFinished || 0;
          badgesCount.value = data.badges?.length || 0;
          skillsList.value = data.skills || [];
          
          // Generate recent activities based on module completion
          if (data.progress) {
            const activities = [];
            
            for (const [moduleId, timestamp] of Object.entries(data.progress)) {
              activities.push({
                title: `Completed Module ${moduleId.replace('moduleID', '')}`,
                date: timestamp.toDate()
              });
            }
            
            // Sort by most recent first
            activities.sort((a, b) => b.date - a.date);
            recentActivities.value = activities;
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };
    
    return {
      userName,
      modulesFinished,
      badgesCount,
      skillsList,
      progressPercentage,
      recentActivities,
      formatDate
    };
  }
};
</script>

<style scoped>
.home-container {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

/* Stats Container */
.stats-container {
  display: flex;
  flex-direction: column;
  max-width: 800px;
  padding: 0;
}

/* Card Wrapper */
.stats-card {
  width: 100%;
  border-radius: 16px;
  background-color: #fff;
}

/* Left: Big Box */
.big-box {
  background-color: #b8d6f7;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Progress Bar */
.progress-bar {
  height: 12px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  margin-top: 16px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3080e3;
  border-radius: 10px;
}

/* Right: Small Boxes (Stacked) */
.right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.small-box {
  height: 92px;
}

.badges-box {
  background-color: #f08bb5;
}

.skills-box {
  background-color: #9fd1c7;
}

.skills-list {
  font-size: 0.9rem;
  margin-top: 8px;
  font-weight: 600;
}

/* General Card Style */
.stat-box {
  color: #272d4e;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

/* Activity Section */
.activity-card {
  width: 100%;
  border-radius: 16px;
  background-color: #fff;
}

.timeline {
  position: relative;
  padding-left: 20px;
  margin-top: 20px;
}

.timeline:before {
  content: '';
  position: absolute;
  left: 0;
  top: 5px;
  height: calc(100% - 10px);
  width: 2px;
  background-color: #ddd;
}

.timeline-item {
  position: relative;
  margin-bottom: 16px;
}

.timeline-dot {
  position: absolute;
  left: -25px;
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #f08bb5;
}

.timeline-content {
  padding-bottom: 8px;
}

.activity-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.activity-date {
  font-size: 0.8rem;
  color: #666;
}

/* Text Styling */
.stat-box small {
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.85;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin-top: 4px;
}

.section-heading {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
  color: #272d4e;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .v-row {
    flex-direction: column;
  }
  
  .v-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  .big-box {
    height: 150px;
    margin-bottom: 16px;
  }
  
  .stat-number {
    font-size: 2rem;
  }
}
</style>