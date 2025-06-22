<template>
  <div class="learning-path-container">
    <!-- Search Bar -->
    <v-text-field
      v-model="searchQuery"
      placeholder="Search modules"
      prepend-inner-icon="mdi-magnify"
      class="custom-search-bar mb-6"
      hide-details
      variant="solo"
      flat
      rounded
    />

    <!-- Your Learning Path -->
    <h2 class="section-title">
      Your Learning Path ({{ totalWeeklyHours }}h/week of {{ availableTime }}h)
    </h2>
    <ModulesList
      :modules="filteredLearningPath"
      @module-selected="goToModuleDetails"
      @add-to-path="addToPath"
    >
      <template #action="{ module }">
        <v-btn color="error" small @click.stop="removeFromPath(module)">Remove</v-btn>
      </template>
    </ModulesList>

    <!-- Module Catalog -->
    <h2 class="section-title mt-10">Explore Modules</h2>
    <ModulesList
      :modules="filteredCatalog"
      @module-selected="goToModuleDetails"
      @add-to-path="addToPath"
    >
      <template #action="{ module }">
        <v-btn
          color="primary"
          small
          :disabled="!canAddModule(module)"
          @click.stop="addToPath(module)"
        >Add</v-btn>
      </template>
    </ModulesList>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, firestore } from '@/firebase'
import ModulesList from '@/components/ModulesList.vue'

export default {
  name: 'LearningPath',
  components: { ModulesList },
  setup() {
    const router = useRouter()
    const allModules = ref([])
    const learningPath = ref([])
    const searchQuery = ref('')
    const availableTime = ref(10) // default fallback

    const loadModules = async () => {
      const uid = auth.currentUser?.uid
      if (!uid) return

      const userDoc = await getDoc(doc(firestore, 'users', uid))
      const userData = userDoc.data()

      const modulesInProgress = userData.modulesInProgress || []
      const progressArray = userData.progress || []

      const snapshot = await getDocs(collection(firestore, 'modules'))
      allModules.value = snapshot.docs.map(doc => {
        const id = doc.id
        const index = modulesInProgress.indexOf(id)
        const progress = index !== -1 ? progressArray[index] : 0

        return {
          id,
          ...doc.data(),
          progress
        }
      })
    }


    const loadLearningPath = async () => {
      const uid = auth.currentUser?.uid
      if (!uid) return

      const userDoc = await getDoc(doc(firestore, 'users', uid))
      const userData = userDoc.data()

      if (userData.availableTime) {
        availableTime.value = userData.availableTime
      }

      const modulesInProgress = userData.modulesInProgress || []
      const progressArray = userData.progress || []

      if (Array.isArray(userData.learningPath)) {
        const selectedModules = []
        for (const id of userData.learningPath) {
          const modDoc = await getDoc(doc(firestore, 'modules', id))
          if (modDoc.exists()) {
            const progressIndex = modulesInProgress.indexOf(id)
            selectedModules.push({ id, ...modDoc.data(), progress: progressIndex !== -1 ? progressArray[progressIndex] : 0 })
        }
      }
        learningPath.value = selectedModules
      }
    }

    const saveLearningPath = async () => {
      const uid = auth.currentUser?.uid
      if (!uid) return

      await updateDoc(doc(firestore, 'users', uid), {
        learningPath: learningPath.value.map(m => m.id)
      })
    }

    const addToPath = (module) => {
      if (!canAddModule(module)) return
      if (!learningPath.value.find(m => m.id === module.id)) {
        learningPath.value.push(module)
        saveLearningPath()
      }
    }

    const removeFromPath = (module) => {
      learningPath.value = learningPath.value.filter(m => m.id !== module.id)
      saveLearningPath()
    }

    const canAddModule = (module) => {
      const hoursAfterAdding = totalWeeklyHours.value + (module.estimatedTime || 0)
      return !learningPath.value.find(m => m.id === module.id) &&
             hoursAfterAdding <= availableTime.value
    }

    const totalWeeklyHours = computed(() => {
      return learningPath.value.reduce((sum, mod) => sum + (mod.estimatedTime || 0), 0)
    })

    const filteredLearningPath = computed(() => {
      return learningPath.value.filter(mod =>
        mod.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    })

    const filteredCatalog = computed(() => {
      return allModules.value
        .filter(mod =>
          mod.title.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
          !learningPath.value.find(m => m.id === mod.id)
        )
    })

    const goToModuleDetails = (module) => {
      router.push({ name: 'ModuleDetails', params: { moduleId: module.id } })
    }

    onMounted(async () => {
      await loadModules()
      await loadLearningPath()
    })

    return {
      allModules,
      learningPath,
      searchQuery,
      filteredLearningPath,
      filteredCatalog,
      totalWeeklyHours,
      availableTime,
      addToPath,
      removeFromPath,
      canAddModule,
      goToModuleDetails
    }
  }
}
</script>

<style scoped>
.learning-path-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.custom-search-bar {
  border-radius: 12px; 
  border: 1px solid #ccc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  min-height: 56px;
}

.custom-search-bar input {
  padding-left: 14px;
  font-size: 1rem;
  color: #333; /* Darker text */
}

.custom-search-bar .v-label {
  color: #555 !important;
}

</style>
