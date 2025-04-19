<template>
    <div class="learning-path">
      <h1>Your Learning Path</h1>
  
      <div v-if="loading" class="loading">Loading...</div>
  
      <div v-else class="timeline-container">
        <!-- Timeline header with dates -->
        <div class="timeline-header">
          <div class="timeline-date start">{{ formatDate(timelineStart) }}</div>
          <div class="timeline-date end">{{ formatDate(timelineEnd) }}</div>
        </div>
  
        <!-- Main timeline with markers -->
        <div class="timeline">
          <div class="timeline-line"></div>
          
          <!-- Timeline markers for modules -->
          <div
            v-for="module in modules"
            :key="`marker-${module.id}`"
            class="timeline-marker"
            :style="{ 
              left: calculateOffset(module.startDate) + '%',
              backgroundColor: module.color
            }"
          ></div>
        </div>
  
        <!-- Module cards section in rows to prevent overlap -->
        <div class="modules-container">
          <div
            v-for="(row, rowIndex) in organizedModules"
            :key="`row-${rowIndex}`"
            class="module-row"
            :style="{ top: `${rowIndex * 160}px` }"
          >
            <div
              v-for="module in row"
              :key="module.id"
              class="module-wrapper"
              :style="{
                left: calculateOffset(module.startDate) + '%',
                width: calculateDuration(module.startDate, module.estimatedFinishDate) + '%'
              }"
            >
              <div class="module-card" :style="{ borderTopColor: module.color }">
                <div class="module-header">
                  <span class="module-color-indicator" :style="{ backgroundColor: module.color }"></span>
                  <h3>{{ module.title }}</h3>
                  <div class="module-progress">
                    <div class="progress-bar" :style="{ width: module.progress + '%' }"></div>
                  </div>
                </div>
                <p class="module-description">{{ module.description }}</p>
                <div class="module-dates">
                  <span>{{ formatDate(module.startDate) }} - {{ formatDate(module.estimatedFinishDate) }}</span>
                </div>
                <button @click="goToModule(module.id)" :style="{ backgroundColor: adjustColor(module.color, -20) }">
                  {{ module.progress > 0 ? 'Continue' : 'Start' }}
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Recommended modules section -->
        <div class="recommendations" v-if="recommendations.length">
          <h2>Recommended Modules</h2>
          <div class="recommendations-grid">
            <div
              v-for="rec in recommendations"
              :key="rec.id"
              class="recommendation-card"
            >
              <h4>{{ rec.title }}</h4>
              <p>{{ rec.description }}</p>
              <button @click="goToModule(rec.id)">Start</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { auth, firestore } from "@/firebase";
  import { onAuthStateChanged } from "firebase/auth";
  import { collection, getDocs, doc, getDoc } from "firebase/firestore";
  
  export default {
    data() {
      return {
        userId: null,
        userSkills: [],
        userGoals: [],
        userProgress: {},
        userAvailableTime: 1,
        modules: [],
        organizedModules: [],
        recommendations: [],
        loading: true,
        timelineStart: null,
        timelineEnd: null,
        colors: [
          "#4285F4", // Blue
          "#EA4335", // Red
          "#FBBC05", // Yellow
          "#34A853", // Green
          "#8E24AA", // Purple
          "#F06292", // Pink
          "#FF9800", // Orange
          "#00ACC1", // Cyan
          "#5E35B1", // Deep Purple
          "#43A047"  // Deep Green
        ]
      };
    },
  
    created() {
      this.initUser();
    },
  
    methods: {
      async initUser() {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            this.userId = user.uid;
            await this.fetchUserData();
            await this.fetchModules();
            await this.fetchRecommendations();
            this.organizeModulesInRows();
          } else {
            console.error("No user logged in.");
          }
          this.loading = false;
        });
      },
  
      async fetchUserData() {
        const userDoc = doc(firestore, "users", this.userId);
        const userSnapshot = await getDoc(userDoc);
  
        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          this.userGoals = data.goals || [];
          this.userSkills = data.skills || [];
          this.userProgress = data.progress || {};
          this.userAvailableTime = data.availableTime || 1;
        } else {
          console.warn("User document does not exist");
        }
      },
  
      async fetchModules() {
        const modulesCollection = collection(firestore, "modules");
        const modulesSnapshot = await getDocs(modulesCollection);
        const allModules = [];
  
        let earliest = null;
        let latest = null;
  
        modulesSnapshot.forEach((docSnap, index) => {
          const moduleData = docSnap.data();
          const moduleId = docSnap.id;
  
          const estimatedTime = moduleData.estimatedTime || 0;
          const dailyTime = this.userAvailableTime || 1;
          const daysToComplete = Math.ceil(estimatedTime / dailyTime);
  
          const startTimestamp = this.userProgress[moduleId];
          const startDate = startTimestamp ? new Date(startTimestamp.seconds * 1000) : new Date();
          const estimatedFinishDate = new Date(startDate);
          estimatedFinishDate.setDate(startDate.getDate() + daysToComplete);
  
          if (!earliest || startDate < earliest) earliest = startDate;
          if (!latest || estimatedFinishDate > latest) latest = estimatedFinishDate;
  
          // Assign a color from our color palette
          const colorIndex = index % this.colors.length;
  
          allModules.push({
            id: moduleId,
            title: moduleData.title,
            description: moduleData.description,
            tasks: moduleData.tasks || [],
            startDate,
            estimatedFinishDate,
            progress: this.userProgress[moduleId] ? (this.userProgress[moduleId].progress || 0) : 0,
            color: this.colors[colorIndex]
          });
        });
  
        // Add buffer days to the timeline for better visualization
        if (earliest && latest) {
          const bufferDays = 2;
          earliest = new Date(earliest);
          earliest.setDate(earliest.getDate() - bufferDays);
          
          latest = new Date(latest);
          latest.setDate(latest.getDate() + bufferDays);
        }
  
        this.timelineStart = earliest;
        this.timelineEnd = latest;
        this.modules = allModules;
      },
  
      // Organize modules in rows to prevent overlap
      organizeModulesInRows() {
        if (!this.modules.length) return;
        
        // Sort modules by start date
        const sortedModules = [...this.modules].sort((a, b) => 
          a.startDate - b.startDate
        );
        
        const rows = [];
        
        // Organize modules into rows to prevent overlap
        sortedModules.forEach(module => {
          let placed = false;
          
          // Try to place the module in an existing row
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const lastModuleInRow = row[row.length - 1];
            
            // Check if this module can be placed after the last module in this row
            // Add a small buffer (1 day) to prevent tight placement
            const bufferTime = 24 * 60 * 60 * 1000; // 1 day in milliseconds
            if (module.startDate >= new Date(lastModuleInRow.estimatedFinishDate.getTime() - bufferTime)) {
              row.push(module);
              placed = true;
              break;
            }
          }
          
          // If module couldn't be placed in existing rows, create a new row
          if (!placed) {
            rows.push([module]);
          }
        });
        
        this.organizedModules = rows;
      },
  
      async fetchRecommendations() {
        const allModulesSnapshot = await getDocs(collection(firestore, "modules"));
        this.recommendations = allModulesSnapshot.docs
          .map((doc) => {
            const module = doc.data();
            if (
              module.recommendedFor &&
              this.userGoals.some((goal) =>
                module.recommendedFor.includes(goal)
              ) &&
              !this.modules.some(m => m.id === doc.id) // Avoid recommending modules already in the timeline
            ) {
              return {
                id: doc.id,
                title: module.title,
                description: module.description,
              };
            }
            return null;
          })
          .filter((module) => module !== null);
      },
  
      formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
  
      calculateOffset(date) {
        if (!this.timelineStart || !this.timelineEnd) return 0;
        const total = this.timelineEnd - this.timelineStart;
        const offset = new Date(date) - this.timelineStart;
        return Math.max(0, Math.min(100, (offset / total) * 100)).toFixed(2);
      },
  
      calculateDuration(startDate, endDate) {
        if (!this.timelineStart || !this.timelineEnd || !startDate || !endDate) return 10;
        const total = this.timelineEnd - this.timelineStart;
        const duration = new Date(endDate) - new Date(startDate);
        return Math.max(10, (duration / total) * 100).toFixed(2); // Minimum width of 10%
      },
  
      // Adjust color brightness (positive amount brightens, negative darkens)
      adjustColor(color, amount) {
        if (typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        console.error('Invalid color:', color);
        return; // Early exit if color is invalid
        }

        // Convert hex to RGB
        let r = parseInt(color.substring(1, 3), 16);
        let g = parseInt(color.substring(3, 5), 16);
        let b = parseInt(color.substring(5, 7), 16);
  
        // Adjust each component
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
  
        // Convert back to hex
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      },
  
      async goToModule(moduleId) {
        this.$router.push(`/module/${moduleId}`);
      },
    },
  };
  </script>
  
  <style scoped>
  .learning-path {
    padding: 20px;
    max-width: 100%;
    overflow-x: hidden;
  }
  
  .loading {
    text-align: center;
    padding: 40px;
    font-size: 18px;
    color: #666;
  }
  
  .timeline-container {
    margin: 40px 0;
    position: relative;
    padding: 20px 40px;
    border-radius: 12px;
    background-color: #f9f9f9;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  /* Timeline header with dates */
  .timeline-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    padding: 0 10px;
    font-size: 14px;
    color: #666;
  }
  
  /* Main timeline */
  .timeline {
    position: relative;
    height: 30px;
    margin-bottom: 20px;
  }
  
  .timeline-line {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 4px;
    background-color: #ccc;
    transform: translateY(-50%);
    border-radius: 2px;
  }
  
  .timeline-marker {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    border: 2px solid white;
  }
  
  /* Modules section */
  .modules-container {
    position: relative;
    min-height: 200px;
    margin-bottom: 40px;
    padding-bottom: 120px; /* Space for multiple rows */
  }
  
  .module-row {
    position: absolute;
    left: 0;
    right: 0;
    height: 140px;
  }
  
  .module-wrapper {
    position: absolute;
    min-width: 150px;
    transform: translateX(-50%);
    transition: all 0.3s ease;
  }
  
  .module-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-top: 4px solid #007bff;
    margin-top: 16px;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .module-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
  
  .module-card::before {
    content: '';
    position: absolute;
    top: -16px;
    left: 50%;
    width: 2px;
    height: 16px;
    background-color: #007bff;
    transform: translateX(-50%);
  }
  
  .module-header {
    margin-bottom: 10px;
    position: relative;
  }
  
  .module-color-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }
  
  .module-header h3 {
    margin: 0 0 10px;
    font-size: 16px;
    color: #333;
  }
  
  .module-progress {
    height: 6px;
    background-color: #eee;
    border-radius: 3px;
    overflow: hidden;
  }
  
  .progress-bar {
    height: 100%;
    background-color: #4caf50;
    border-radius: 3px;
  }
  
  .module-description {
    margin: 10px 0;
    font-size: 14px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .module-dates {
    font-size: 12px;
    color: #888;
    margin-bottom: 10px;
  }
  
  .module-card button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    width: 100%;
    transition: background-color 0.2s;
  }
  
  .module-card button:hover {
    opacity: 0.9;
  }
  
  /* Recommendations section */
  .recommendations {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }
  
  .recommendations h2 {
    margin-bottom: 20px;
    font-size: 18px;
    color: #333;
  }
  
  .recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .recommendation-card {
    background-color: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s;
  }
  
  .recommendation-card:hover {
    transform: translateY(-3px);
  }
  
  .recommendation-card h4 {
    margin-top: 0;
    color: #333;
  }
  
  .recommendation-card p {
    font-size: 14px;
    color: #666;
    margin-bottom: 15px;
  }
  
  .recommendation-card button {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    width: 100%;
    transition: background-color 0.2s;
  }
  
  .recommendation-card button:hover {
    background-color: #218838;
  }
  
  /* Responsive styles */
  @media (max-width: 768px) {
    .timeline-container {
      padding: 10px;
      overflow-x: scroll;
    }
    
    .modules-container {
      min-width: 800px; /* Ensure horizontal scrolling works on mobile */
    }
  }
  </style>