<template>
  <div class="achievements-container">
    <h1>Your Achievements</h1>
    
    <!-- Badges Section -->
    <v-card class="achievement-card mt-4" elevation="2">
      <v-card-title class="section-heading">
        <v-icon large color="#f08bb5" class="mr-2">mdi-medal</v-icon>
        Your Badges
      </v-card-title>
      <v-card-text>
        <div v-if="userBadges.length === 0" class="text-center pa-4 grey--text">
          You haven't earned any badges yet. Complete modules to earn badges!
        </div>
        <div v-else class="badges-grid">
          <v-hover v-for="badge in userBadges" :key="badge.id">
            <template v-slot="{ hover }">
              <v-card
                class="badge-item"
                :elevation="hover ? 8 : 2"
                :class="{ 'on-hover': hover }"
              >
                <div class="badge-icon-container" :class="`badge-color-${badge.color}`">
                  <v-icon size="36">{{ badge.icon }}</v-icon>
                </div>
                <div class="badge-name">{{ badge.name }}</div>
                <div class="badge-description">{{ badge.description }}</div>
                <div class="badge-earned">Earned: {{ formatDate(badge.earnedDate) }}</div>
              </v-card>
            </template>
          </v-hover>
          <v-card
            v-for="n in (4 - userBadges.length)"
            :key="`empty-${n}`"
            class="badge-item badge-locked"
            elevation="1"
          >
            <div class="badge-icon-container badge-color-grey">
              <v-icon size="36">mdi-lock</v-icon>
            </div>
            <div class="badge-name">???</div>
            <div class="badge-description">Complete more modules to unlock</div>
          </v-card>
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

        
        <v-tabs-items v-model="leaderboardTab">
          <!-- Modules Completion Leaderboard -->
          <v-tab-item>
            <v-data-table
              :headers="moduleHeaders"
              :items="moduleLeaderboard"
              :items-per-page="5"
              :loading="loading"
              class="leaderboard-table"
              hide-default-footer
            >
              <template v-slot:item="{ item }">
                <tr>
                  <td>
                    <div class="rank-cell">
                      <v-icon v-if="item.rank <= 3" color="amber darken-2">mdi-crown</v-icon>
                      <span :class="{ 'font-weight-bold': item.isCurrentUser }">{{ item.rank }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="name-cell" :class="{ 'current-user': item.isCurrentUser }">
                      <v-avatar size="32" class="mr-2">
                        <v-icon v-if="!item.avatar" color="grey lighten-1">mdi-account</v-icon>
                        <img v-else :src="item.avatar" alt="User Avatar">
                      </v-avatar>
                      {{ item.name }}
                      <v-icon v-if="item.isCurrentUser" small color="#f08bb5" class="ml-2">mdi-account-check</v-icon>
                    </div>
                  </td>
                  <td>
                    <div class="progress-cell">
                      <span class="mr-2">{{ item.modulesFinished }}/5</span>
                      <v-progress-linear
                        :value="(item.modulesFinished / 5) * 100"
                        height="8"
                        rounded
                        :color="item.isCurrentUser ? '#f08bb5' : '#b8d6f7'"
                      ></v-progress-linear>
                    </div>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-tab-item>
          
          <!-- Badges Leaderboard -->
          <v-tab-item>
            <v-data-table
              :headers="badgeHeaders"
              :items="badgeLeaderboard"
              :items-per-page="5"
              :loading="loading"
              class="leaderboard-table"
              hide-default-footer
            >
              <template v-slot:item="{ item }">
                <tr>
                  <td>
                    <div class="rank-cell">
                      <v-icon v-if="item.rank <= 3" color="amber darken-2">mdi-crown</v-icon>
                      <span :class="{ 'font-weight-bold': item.isCurrentUser }">{{ item.rank }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="name-cell" :class="{ 'current-user': item.isCurrentUser }">
                      <v-avatar size="32" class="mr-2">
                        <v-icon v-if="!item.avatar" color="grey lighten-1">mdi-account</v-icon>
                        <img v-else :src="item.avatar" alt="User Avatar">
                      </v-avatar>
                      {{ item.name }}
                      <v-icon v-if="item.isCurrentUser" small color="#f08bb5" class="ml-2">mdi-account-check</v-icon>
                    </div>
                  </td>
                  <td>
                    <div class="badges-cell">
                      <v-icon v-for="n in item.badgeCount" :key="n" small color="#f08bb5" class="mr-1">mdi-medal</v-icon>
                      <v-icon v-for="n in (5 - item.badgeCount)" :key="`empty-${n}`" small color="grey lighten-2" class="mr-1">mdi-medal-outline</v-icon>
                    </div>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { auth, firestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default {
  name: "AchievementsView",
  setup() {
    const userBadges = ref([]);
    const moduleLeaderboard = ref([]);
    const badgeLeaderboard = ref([]);
    const leaderboardTab = ref(0);
    const loading = ref(true);
    const currentUserId = ref("");
    
    // Badge data mapping (map badgeId to badge details)
    const badgeData = {
      "A3WY3eqfVK6a9a1AgkzH": {
        id: "A3WY3eqfVK6a9a1AgkzH",
        name: "Coding Master",
        description: "Completed all coding modules",
        icon: "mdi-code-braces",
        color: "blue"
      },
      "K9bRk0kI7bOns79LG3mS": {
        id: "K9bRk0kI7bOns79LG3mS",
        name: "Quick Learner",
        description: "Finished 2 modules in record time",
        icon: "mdi-rocket",
        color: "purple"
      },
      "y68S2lGmZ2gdCs4cxmVj": {
        id: "y68S2lGmZ2gdCs4cxmVj",
        name: "Early Bird",
        description: "One of the first 100 members",
        icon: "mdi-bird",
        color: "orange"
      },
      // Add more badges as needed
    };
    
    const moduleHeaders = [
      { text: "Rank", value: "rank", width: "80px" },
      { text: "Name", value: "name" },
      { text: "Modules Completed", value: "modulesFinished" }
    ];
    
    const badgeHeaders = [
      { text: "Rank", value: "rank", width: "80px" },
      { text: "Name", value: "name" },
      { text: "Badges Earned", value: "badgeCount" }
    ];
    
    onMounted(async () => {
      currentUserId.value = auth.currentUser?.uid;
      
      if (!currentUserId.value) {
        loading.value = false;
        return;
      }
      
      try {
        // Fetch user's badges
        const userDoc = await getDoc(doc(firestore, "users", currentUserId.value));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Process user badges
          if (userData.badges && userData.badges.length > 0) {
            userData.badges.forEach(badgeId => {
              if (badgeData[badgeId]) {
                const badge = {
                  ...badgeData[badgeId],
                  earnedDate: new Date() // Ideally this would come from the database
                };
                userBadges.value.push(badge);
              }
            });
          }
          
          // Fetch leaderboard data
          await fetchLeaderboards();
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        loading.value = false;
      }
    });
    
    const fetchLeaderboards = async () => {
      try {
        // In a real app, fetch this data from Firestore
        // For this implementation, we use mock data for demonstration
        
        // Mock leaderboard data (modules completed)
        moduleLeaderboard.value = [
          { rank: 1, name: "Alex Johnson", modulesFinished: 5, isCurrentUser: false },
          { rank: 2, name: "Maya Rodriguez", modulesFinished: 4, isCurrentUser: false },
          { rank: 3, name: "Chloe", modulesFinished: 2, isCurrentUser: true },
          { rank: 4, name: "Jordan Lee", modulesFinished: 2, isCurrentUser: false },
          { rank: 5, name: "Taylor Smith", modulesFinished: 1, isCurrentUser: false }
        ];
        
        // Mock leaderboard data (badges earned)
        badgeLeaderboard.value = [
          { rank: 1, name: "Alex Johnson", badgeCount: 5, isCurrentUser: false },
          { rank: 2, name: "Maya Rodriguez", badgeCount: 4, isCurrentUser: false },
          { rank: 3, name: "Taylor Smith", badgeCount: 3, isCurrentUser: false },
          { rank: 4, name: "Chloe", badgeCount: 3, isCurrentUser: true },
          { rank: 5, name: "Jordan Lee", badgeCount: 2, isCurrentUser: false }
        ];
        
        // Commented implementation for fetching real data from Firestore
        // I didnt make enough users to fetch real data
        /*
        // For modules leaderboard
        const moduleUsersQuery = query(
          collection(firestore, "users"),
          orderBy("modulesFinished", "desc"),
          limit(10)
        );
        const moduleQuerySnapshot = await getDocs(moduleUsersQuery);
        
        let moduleRank = 1;
        const moduleLeaderboardData = [];
        
        moduleQuerySnapshot.forEach((doc) => {
          const userData = doc.data();
          moduleLeaderboardData.push({
            rank: moduleRank++,
            name: userData.name || "Anonymous",
            modulesFinished: userData.modulesFinished || 0,
            isCurrentUser: doc.id === currentUserId.value,
            avatar: userData.avatar || null
          });
        });
        
        moduleLeaderboard.value = moduleLeaderboardData;
        
        // For badges leaderboard
        const badgeUsersQuery = query(
          collection(firestore, "users"),
          orderBy("badges", "desc"),
          limit(10)
        );
        const badgeQuerySnapshot = await getDocs(badgeUsersQuery);
        
        let badgeRank = 1;
        const badgeLeaderboardData = [];
        
        badgeQuerySnapshot.forEach((doc) => {
          const userData = doc.data();
          badgeLeaderboardData.push({
            rank: badgeRank++,
            name: userData.name || "Anonymous",
            badgeCount: (userData.badges || []).length,
            isCurrentUser: doc.id === currentUserId.value,
            avatar: userData.avatar || null
          });
        });
        
        badgeLeaderboard.value = badgeLeaderboardData;
        */
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };
    
    return {
      userBadges,
      moduleLeaderboard,
      badgeLeaderboard,
      leaderboardTab,
      loading,
      moduleHeaders,
      badgeHeaders,
      formatDate
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.badge-item {
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.badge-item.on-hover {
  transform: translateY(-5px);
}

.badge-locked {
  background-color: #f5f5f5;
  opacity: 0.7;
}

.badge-icon-container {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
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

.badge-color-grey {
  background-color: #e0e0e0;
}

.badge-name {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.badge-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 12px;
  line-height: 1.2;
}

.badge-earned {
  font-size: 0.8rem;
  color: #888;
  margin-top: auto;
}

/* Leaderboard */
.leaderboard-table {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.rank-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name-cell {
  display: flex;
  align-items: center;
}

.current-user {
  font-weight: bold;
  color: #f08bb5;
}

.progress-cell {
  display: flex;
  align-items: center;
  width: 100%;
}

.badges-cell {
  display: flex;
  align-items: center;
}

/* Tab customization */
.v-tab {
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 600px) {
  .badges-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .badge-item {
    height: 180px;
    padding: 12px;
  }
  
  .badge-icon-container {
    width: 48px;
    height: 48px;
  }
  
  .badge-name {
    font-size: 1rem;
  }
  
  .badge-description {
    font-size: 0.8rem;
  }
}
</style>