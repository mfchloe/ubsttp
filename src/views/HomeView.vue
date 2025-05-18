<template>
  <div class="home-container">
    <h1>Welcome to EmpowHer, {{ userName }}</h1>
    
    <v-container class="dashboard-container">
      <v-row>
        <!-- Left Half -->
        <v-col cols="12" md="6" class="left-section">
          <!-- Streak and Badges Row -->
          <v-card class="chart-card streak-badges-card" elevation="2">
            <v-card-title class="chart-title">Your Progress</v-card-title>
            <v-row class="ma-0">
              <!-- Streak Counter -->
              <v-col cols="6" class="pa-0">
                <v-card class="streak-card" flat height="100%">
                  <v-card-text class="text-center d-flex flex-column justify-center align-center" style="height: 100%">
                    <v-icon size="40" color="orange-darken-2">mdi-fire</v-icon>
                    <div class="stat-number">{{ streak }}</div>
                    <div class="stat-label">days streak</div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <!-- Badges Counter -->
              <v-col cols="6" class="pa-0">
                <v-card class="badges-card" flat height="100%">
                  <v-card-text class="text-center d-flex flex-column justify-center align-center" style="height: 100%">
                    <v-icon size="40" color="deep-purple">mdi-medal</v-icon>
                    <div class="stat-number">{{ badgesCount }}</div>
                    <div class="stat-label">badges earned</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
          
          <!-- Module Stats Section -->
          <v-card class="chart-card module-stats-card mt-4" elevation="2">
            <v-card-title class="chart-title">Module Progress</v-card-title>
            <v-row class="ma-0">
              <!-- Large Left Square: Total Modules -->
              <v-col cols="6" class="pa-0">
                <v-card class="total-modules-card" flat height="100%">
                  <v-card-text class="text-center d-flex flex-column justify-center align-center" style="height: 100%">
                    <div class="stat-label">Total Modules</div>
                    <div class="large-stat-number">{{ totalModules }}</div>
                    <div class="stat-label">signed up</div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <!-- Right Column: Completed and In Progress -->
              <v-col cols="6" class="pa-0">
                <v-row class="ma-0" style="height: 100%">
                  <!-- Completed Modules -->
                  <v-col cols="12" class="pa-0" style="height: 50%">
                    <v-card class="completed-modules-card" flat height="100%">
                      <v-card-text class="text-center d-flex flex-column justify-center align-center" style="height: 100%">
                        <div class="stat-label">Completed</div>
                        <div class="medium-stat-number">{{ modulesFinished.length }}</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <!-- In Progress Modules -->
                  <v-col cols="12" class="pa-0" style="height: 50%">
                    <v-card class="in-progress-modules-card" flat height="100%">
                      <v-card-text class="text-center d-flex flex-column justify-center align-center" style="height: 100%">
                        <div class="stat-label">In Progress</div>
                        <div class="medium-stat-number">{{ modulesInProgress.length }}</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
        
        <!-- Right Half - Charts -->
        <v-col cols="12" md="6" class="right-section">
          <!-- Difficulty Breakdown Chart -->
          <v-card class="chart-card mb-4" elevation="2">
            <v-card-title class="chart-title">Modules by Difficulty</v-card-title>
            <v-card-text>
              <bar-chart :chart-data="difficultyChartData" />
            </v-card-text>
          </v-card>
          
          <!-- Skills Pie Chart -->
          <v-card class="chart-card" elevation="2">
            <v-card-title class="chart-title">Skills Distribution</v-card-title>
            <v-card-text>
              <pie-chart :chart-data="skillsChartData" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { auth, firestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import BarChart from "@/components/BarChart.vue";
import PieChart from "@/components/PieChart.vue";

export default {
  name: "HomeView",
  components: {
    BarChart,
    PieChart
  },
  setup() {
    const userName = ref("User");
    const streak = ref(0);
    const badgesCount = ref(0);
    const modulesFinished = ref([]);
    const modulesInProgress = ref([]);
    const userID = ref("");
    const moduleData = ref([]);
    
    // Chart data
    const difficultyChartData = ref({
      labels: ['Easy', 'Intermediate', 'Hard'],
      datasets: [{
        label: 'Modules',
        data: [0, 0, 0],
        backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
      }]
    });
    
    const skillsChartData = ref({
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#8BC34A', '#90A4AE', '#EA80FC', '#00E676'
        ]
      }]
    });
    
    const totalModules = computed(() => {
      return modulesFinished.value.length + modulesInProgress.value.length;
    });
    
    // Prepare difficulty chart data
    const prepareDifficultyChartData = async () => {
      const difficultyCount = { Easy: 0, Intermediate: 0, Hard: 0 };
      
      // Count modules by difficulty
      moduleData.value.forEach(module => {
        const difficulty = module.difficulty || "Easy";
        if (!difficultyCount[difficulty]) {
          difficultyCount[difficulty] = 0;
        }
        difficultyCount[difficulty]++;
      });
      
      difficultyChartData.value.datasets[0].data = [
        difficultyCount.Easy,
        difficultyCount.Intermediate,
        difficultyCount.Hard
      ];
    };
    
    // Prepare skills chart data based on skillsLearnt in modules
    const prepareSkillsChartData = () => {
      // Collect all skills from all modules signed up
      const skillsLearnt = [];
      moduleData.value.forEach(module => {
        if (module.skillsLearnt && Array.isArray(module.skillsLearnt)) {
          skillsLearnt.push(...module.skillsLearnt);
        }
      });
      
      // Count occurrences of each skill
      const skillCount = {};
      skillsLearnt.forEach(skill => {
        if (skillCount[skill]) {
          skillCount[skill]++;
        } else {
          skillCount[skill] = 1;
        }
      });
      
      // Sort skills by count (descending)
      const sortedSkills = Object.entries(skillCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8); // Take top 8 skills for better visualization
      
      skillsChartData.value.labels = sortedSkills.map(item => item[0]);
      skillsChartData.value.datasets[0].data = sortedSkills.map(item => item[1]);
    };
    
    // Fetch module data
    const fetchModuleData = async () => {
      const allModuleIDs = [...modulesFinished.value, ...modulesInProgress.value];
      
      for (const moduleId of allModuleIDs) {
        try {
          const moduleDoc = await getDoc(doc(firestore, "modules", moduleId));
          if (moduleDoc.exists()) {
            moduleData.value.push(moduleDoc.data());
          }
        } catch (error) {
          console.error("Error fetching module data:", error);
        }
      }
      
      await prepareDifficultyChartData();
      prepareSkillsChartData();
    };
    
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
          streak.value = data.streak || 0;
          badgesCount.value = data.badges?.length || 0;
          modulesFinished.value = data.modulesFinished || [];
          modulesInProgress.value = data.modulesInProgress || [];
          
          // Fetch module data and prepare charts
          await fetchModuleData();
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });
    
    return {
      userName,
      streak,
      badgesCount,
      modulesFinished,
      modulesInProgress,
      totalModules,
      difficultyChartData,
      skillsChartData
    };
  }
};
</script>

<style scoped>
.home-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #272d4e;
}

.dashboard-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  max-width: 100%;
  padding: 0;
}

/* Card Styling */
.chart-card {
  border-radius: 16px;
  overflow: visible;
  height: 300px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.chart-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* Chart title */
.chart-title {
  font-size: 18px;
  color: #272d4e;
  padding: 16px 16px 0;
  text-align: center;
  font-weight: 500;
}

/* Streak & Badges Cards */
.streak-badges-card {
  height: 300px;
}

.streak-card {
  height: 100%;
  border-radius: 0;
}

.badges-card {
  height: 100%;
  border-radius: 0;
}

/* Module Stats Section */
.module-stats-card {
  height: 300px;
}

.total-modules-card {
  background-color: #BBDEFB;
  height: 100%;
  border-radius: 0;
}

.completed-modules-card {
  background-color: #C8E6C9;
  height: 100%;
  border-radius: 0;
}

.in-progress-modules-card {
  background-color: #FFF9C4;
  height: 100%;
  border-radius: 0;
}

/* Text Styling */
.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 5px 0;
  color: #272d4e;
}

.large-stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: #272d4e;
}

.medium-stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #272d4e;
}

.stat-label {
  font-size: 0.9rem;
  color: #546E7A;
  font-weight: 500;
}

/* Right section spacing */
.right-section .chart-card:first-child {
  margin-bottom: 16px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .left-section, .right-section {
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  .right-section {
    margin-top: 16px;
  }
}
</style>