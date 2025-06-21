<template>
  <div class="achievements-container">
    
    <!-- Badges Section -->
    <v-card class="achievement-card mt-4" elevation="2">
      <v-card-title class="section-heading">
        <v-icon large color="#f08bb5" class="mr-2">mdi-medal</v-icon>
        Your Badges
      </v-card-title>
      <v-card-text>
        <div v-if="loading" class="text-center pa-4">
          <v-progress-circular indeterminate color="#f08bb5"></v-progress-circular>
          <div class="mt-2">Loading your achievements...</div>
        </div>
        <div v-else-if="userBadges.length === 0" class="text-center pa-4 grey--text">
          You haven't earned any badges yet. Complete modules to earn badges!
        </div>
        <div v-else class="badges-grid">
          <v-hover v-for="badge in userBadges" :key="badge.badgeID">
            <template v-slot="{ hover }">
              <v-card
                class="badge-item"
                :elevation="hover ? 8 : 2"
                :class="{ 'on-hover': hover }"
              >
                <div class="badge-icon-container" :class="`badge-color-${getBadgeColor(badge.title)}`">
                  <v-icon size="36">{{ getBadgeIcon(badge.title) }}</v-icon>
                </div>
                <div class="badge-content">
                  <div class="badge-name">{{ badge.title }}</div>
                  <div class="badge-description">{{ badge.description }}</div>
                  <div class="badge-earned">Earned</div>
                </div>
              </v-card>
            </template>
          </v-hover>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Leaderboard Section -->
    <v-card class="achievement-card mt-6" elevation="2">
      <v-card-title class="section-heading">
        <v-icon large color="#b8d6f7" class="mr-2">mdi-trophy</v-icon>
        Leaderboard
      </v-card-title>
      <v-card-text>
        <v-tabs v-model="leaderboardTab" centered color="#f08bb5" slider-color="#f08bb5">
          <v-tab value="modules">Modules Completed</v-tab>
          <v-tab value="badges">Badges Earned</v-tab>
        </v-tabs>
        
        <v-window v-model="leaderboardTab">
          <!-- Modules Completion Leaderboard -->
          <v-window-item value="modules">
            <div>
            <v-data-table
              :headers="moduleHeaders"
              :items="moduleLeaderboard"
              :items-per-page="10"
              :loading="loading"
              class="leaderboard-table"
              hide-default-footer
            >
              <template v-slot:item="{ item, index }">
                <tr :class="{ 'current-user-row': item.isCurrentUser }">
                  <td>
                    <div class="rank-cell">
                      <v-icon v-if="index === 0" color="#FFD700" size="20">mdi-medal</v-icon>
                      <v-icon v-else-if="index === 1" color="#C0C0C0" size="20">mdi-medal</v-icon>
                      <v-icon v-else-if="index === 2" color="#CD7F32" size="20">mdi-medal</v-icon>
                      <span :class="{ 'font-weight-bold': item.isCurrentUser }">{{ index + 1 }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="name-cell" :class="{ 'current-user': item.isCurrentUser }">
                      <v-avatar size="32" class="mr-2">
                        <v-icon v-if="!item.avatar" color="grey lighten-1">mdi-account</v-icon>
                        <img v-else :src="item.avatar" alt="User Avatar">
                      </v-avatar>
                      {{ item.name }}
                    </div>
                  </td>
                  <td class="text-right">
                    <span class="score-number">{{ item.modulesFinished }}</span>
                  </td>
                </tr>
              </template>
            </v-data-table>
            </div>
          </v-window-item>
          
          <!-- Badges Leaderboard -->
          <v-window-item value="badges">
            <div>
            <v-data-table
              :headers="badgeHeaders"
              :items="badgeLeaderboard"
              :items-per-page="10"
              :loading="loading"
              class="leaderboard-table"
              hide-default-footer
            >
              <template v-slot:item="{ item, index }">
                <tr :class="{ 'current-user-row': item.isCurrentUser }">
                  <td>
                    <div class="rank-cell">
                      <v-icon v-if="index === 0" color="#FFD700" size="20">mdi-medal</v-icon>
                      <v-icon v-else-if="index === 1" color="#C0C0C0" size="20">mdi-medal</v-icon>
                      <v-icon v-else-if="index === 2" color="#CD7F32" size="20">mdi-medal</v-icon>
                      <span :class="{ 'font-weight-bold': item.isCurrentUser }">{{ index + 1 }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="name-cell" :class="{ 'current-user': item.isCurrentUser }">
                      <v-avatar size="32" class="mr-2">
                        <v-icon v-if="!item.avatar" color="grey lighten-1">mdi-account</v-icon>
                        <img v-else :src="item.avatar" alt="User Avatar">
                      </v-avatar>
                      {{ item.name }}
                    </div>
                  </td>
                  <td class="text-right">
                    <span class="score-number">{{ item.badgeCount }}</span>
                  </td>
                </tr>
              </template>
            </v-data-table>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { auth, firestore } from "@/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default {
  name: "AchievementsView",
  setup() {
    const userBadges = ref([]);
    const availableBadges = ref([]);
    const moduleLeaderboard = ref([]);
    const badgeLeaderboard = ref([]);
    const leaderboardTab = ref("modules");
    const loading = ref(true);
    const currentUserId = ref("");
    
    const moduleHeaders = [
      { text: "Rank", value: "rank", width: "80px" },
      { text: "Name", value: "name" },
      { text: "Modules Completed", value: "modulesFinished", align: "right" }
    ];
    
    const badgeHeaders = [
      { text: "Rank", value: "rank", width: "80px" },
      { text: "Name", value: "name" },
      { text: "Badges Earned", value: "badgeCount", align: "right" }
    ];
    
    onMounted(async () => {
      currentUserId.value = auth.currentUser?.uid;
      
      if (!currentUserId.value) {
        loading.value = false;
        return;
      }
      
      try {
        await Promise.all([
          fetchUserData(),
          fetchAvailableBadges(),
          fetchLeaderboards()
        ]);
      } catch (error) {
        console.error("Error fetching achievement data:", error);
      } finally {
        loading.value = false;
      }
    });
    
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, "users", currentUserId.value));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Fetch user's badges - badges is an array of badge IDs
          if (userData.badges && Array.isArray(userData.badges) && userData.badges.length > 0) {
            const badgePromises = userData.badges.map(async (badgeId) => {
              try {
                const badgeDoc = await getDoc(doc(firestore, "badges", badgeId));
                if (badgeDoc.exists()) {
                  return { badgeID: badgeDoc.id, ...badgeDoc.data() };
                }
                return null;
              } catch (error) {
                console.error(`Error fetching badge ${badgeId}:`, error);
                return null;
              }
            });
            
            const badgeResults = await Promise.all(badgePromises);
            userBadges.value = badgeResults.filter(badge => badge !== null);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    const fetchAvailableBadges = async () => {
      try {
        const badgesSnapshot = await getDocs(collection(firestore, "badges"));
        const allBadges = badgesSnapshot.docs.map(doc => ({ 
          badgeID: doc.id, 
          ...doc.data() 
        }));
        
        // Filter out badges the user already has
        const earnedBadgeIds = userBadges.value.map(badge => badge.badgeID);
        availableBadges.value = allBadges.filter(badge => 
          !earnedBadgeIds.includes(badge.badgeID)
        );
      } catch (error) {
        console.error("Error fetching available badges:", error);
      }
    };
    
    const fetchLeaderboards = async () => {
      try {
        // Fetch all users for leaderboard
        const usersSnapshot = await getDocs(collection(firestore, "users"));
        const allUsers = usersSnapshot.docs.map(doc => {
          const userData = doc.data();
          return {
            userID: doc.id,
            name: userData.name || userData.email || "Anonymous",
            avatar: userData.profileURL,
            modulesFinished: Array.isArray(userData.modulesFinished) ? userData.modulesFinished.length : 0,
            badgeCount: Array.isArray(userData.badges) ? userData.badges.length : 0,
            isCurrentUser: doc.id === currentUserId.value
          };
        });
        
        // Create modules leaderboard (sort by modulesFinished)
        moduleLeaderboard.value = [...allUsers]
          .sort((a, b) => b.modulesFinished - a.modulesFinished)
          .slice(0, 10);
        
        // Create badges leaderboard (sort by badgeCount)
        badgeLeaderboard.value = [...allUsers]
          .sort((a, b) => b.badgeCount - a.badgeCount)
          .slice(0, 10);
        
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };
    
    const getBadgeIcon = (title) => {
      const iconMap = {
        "First Steps": "mdi-baby-face",
        "Quick Learner": "mdi-rocket-launch",
        "Consistent Learner": "mdi-calendar-check",
        "Knowledge Seeker": "mdi-book-open-page-variant",
        "Coding Master": "mdi-code-braces",
        "Team Player": "mdi-account-group",
        "Problem Solver": "mdi-puzzle",
        "Tech Pioneer": "mdi-telescope",
        "Mentor": "mdi-account-star",
        "Innovator": "mdi-lightbulb-on"
      };
      
      return iconMap[title] || "mdi-medal";
    };
    
    const getBadgeColor = (title) => {
      const colorMap = {
        "First Steps": "blue",
        "Quick Learner": "purple",
        "Consistent Learner": "green",
        "Knowledge Seeker": "orange",
        "Coding Master": "blue",
        "Team Player": "purple",
        "Problem Solver": "orange",
        "Tech Pioneer": "blue",
        "Mentor": "green",
        "Innovator": "purple"
      };
      
      return colorMap[title] || "blue";
    };
    
    return {
      userBadges,
      availableBadges,
      moduleLeaderboard,
      badgeLeaderboard,
      leaderboardTab,
      loading,
      moduleHeaders,
      badgeHeaders,
      getBadgeIcon,
      getBadgeColor
    };
  }
};
</script>

<style scoped>
.achievements-container {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.achievement-card {
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
}

.section-heading {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  color: #272d4e;
}

/* Badges Grid */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.badge-item {
  border-radius: 12px;
  padding: 20px;
  height: auto;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.badge-item.on-hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.badge-icon-container {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.badge-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  width: 100%;
}

.badge-color-blue {
  background-color: #b8d6f7;
}

.badge-color-purple {
  background-color: #d4bbf8;
}

.badge-color-orange {
  background-color: #ffcc80;
}

.badge-color-green {
  background-color: #c8e6c9;
}

.badge-color-grey {
  background-color: #e0e0e0;
}

.badge-name {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 12px;
  word-wrap: break-word;
  line-height: 1.3;
}

.badge-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 16px;
  line-height: 1.4;
  word-wrap: break-word;
  flex: 1;
  display: flex;
  align-items: center;
}

.badge-earned {
  font-size: 0.8rem;
  color: #4caf50;
  font-weight: 600;
  background-color: #e8f5e8;
  padding: 4px 12px;
  border-radius: 12px;
  margin-top: auto;
}

/* Leaderboard */
.leaderboard-table {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.current-user-row {
  background-color: #f8f9ff;
  border-left: 4px solid #f08bb5;
}

.rank-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-cell {
  display: flex;
  align-items: center;
}

.current-user {
  font-weight: bold;
  color: #f08bb5;
}

.score-number {
  font-weight: 600;
  font-size: 1.1rem;
  color: #272d4e;
}

/* Tab customization */
.v-tab {
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .badges-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .badge-item {
    padding: 16px;
    min-height: 200px;
  }
  
  .badge-icon-container {
    width: 48px;
    height: 48px;
  }
  
  .badge-name {
    font-size: 1rem;
  }
  
  .badge-description {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .badges-grid {
    grid-template-columns: 1fr;
  }
  
  .achievements-container {
    padding: 1rem;
  }
}
</style>