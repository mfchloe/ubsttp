<template>
  <v-container class="module-details" fluid>
    <v-card class="details-card" elevation="2" v-if="module">
      <v-card-title class="title">
        {{ module.title }}
      </v-card-title>

      <v-card-text class="content">
        <p class="description">{{ module.description }}</p>

        <div class="meta">
          <div><strong>Difficulty:</strong> {{ module.difficulty }}</div>
          <div><strong>Estimated Time:</strong> {{ module.estimatedTime }} hours</div>
        </div>

        <div class="progress-section">
          <div class="label"><strong>Progress:</strong> {{ progress }}%</div>
          <v-slider
            v-model="progress"
            min="0"
            max="100"
            step="1"
            thumb-label
            color="primary"
            class="mt-2"
          ></v-slider>

          <v-progress-linear
            :model-value="progress"
            height="8"
            color="primary"
            class="mt-2"
          ></v-progress-linear>
        </div>
      </v-card-text>

      <v-card-actions class="actions">
        <v-btn @click="$router.back()">Back</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveProgress">Save Progress</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { firestore, auth } from '@/firebase'

export default {
  name: 'ModuleDetails',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const moduleId = route.params.moduleId
    const module = ref(null)
    const progress = ref(0)

    const fetchModule = async () => {
      const moduleDoc = await getDoc(doc(firestore, 'modules', moduleId))
      if (moduleDoc.exists()) {
        module.value = { id: moduleDoc.id, ...moduleDoc.data() }
      } else {
        router.replace('/not-found')
      }

      // Load user's current progress
      const userRef = doc(firestore, 'users', auth.currentUser.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const userData = userSnap.data()
        const idx = (userData.modulesInProgress || []).indexOf(moduleId)
        if (idx !== -1) progress.value = userData.progress?.[idx] || 0
      }
    }

    const saveProgress = async () => {
      const userRef = doc(firestore, 'users', auth.currentUser.uid)
      const userSnap = await getDoc(userRef)
      if (!userSnap.exists()) return

      const userData = userSnap.data()
      const modulesInProgress = userData.modulesInProgress || []
      const progressArray = userData.progress || []
      const modulesFinished = userData.modulesFinished || []

      const index = modulesInProgress.indexOf(moduleId)

      if (index === -1) {
        // Add to in-progress if not present
        modulesInProgress.push(moduleId)
        progressArray.push(progress.value)
        } else {
        // Update existing progress
        progressArray[index] = progress.value
        }

        // Handle modulesFinished status
        const finishedIndex = modulesFinished.indexOf(moduleId)
        if (progress.value >= 100) {
        if (index !== -1) {
            // Remove from in-progress arrays
            modulesInProgress.splice(index, 1)
            progressArray.splice(index, 1)
        }
        if (finishedIndex === -1) {
            modulesFinished.push(moduleId)
        }
        } else {
        // If progress < 100, ensure it's not marked as finished
        if (finishedIndex !== -1) {
            modulesFinished.splice(finishedIndex, 1)
        }
        }


      await updateDoc(userRef, {
        modulesInProgress,
        progress: progressArray,
        modulesFinished,
      })

      router.back()
    }

    onMounted(fetchModule)

    return {
      module,
      progress,
      saveProgress,
    }
  },
}
</script>

<style scoped>
.module-details {
  max-width: 700px;
  margin: 2rem auto;
}

.details-card {
  border-radius: 16px;
  padding: 24px;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
}

.description {
  font-size: 1rem;
  color: #444;
  margin-bottom: 1rem;
}

.meta {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-section {
  margin-top: 1rem;
}

.label {
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}
</style>
