<template>
  <div class="modules-list">
    <v-card
      v-for="(module, index) in modules"
      :key="index"
      class="module-card"
      elevation="2"
      @click="openModuleDetails(module)"
    >
      <div class="icon-container">
        <v-icon size="64" color="#f08bb5">
          mdi-book-open-page-variant
        </v-icon>
      </div>

      <v-card-title class="module-title">
        {{ module.title }}
      </v-card-title>

      <v-card-text class="module-info">
        <div class="module-description">
          {{ module.description }}
        </div>
        <div class="module-meta">
          <div><strong>Difficulty:</strong> {{ module.difficulty }}</div>
          <div><strong>Hours per week:</strong> {{ module.estimatedTime }} hrs</div>
        </div>

        <v-progress-linear
          :model-value="module.progress || 0"
          height="8"
          color="primary"
          class="mt-2"
        ></v-progress-linear>
      </v-card-text>

      <v-card-actions class="module-card-actions" @click.stop>
        <slot name="action" :module="module">
          <!-- Fallback Add button if slot not used -->
          <v-btn color="primary" @click.stop="addToPath(module)">Add</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "ModulesList",
  props: {
    modules: {
      type: Array,
      required: true,
    },
  },
  emits: ["module-selected", "add-to-path"],
  methods: {
    openModuleDetails(module) {
      this.$emit("module-selected", module);
    },
    addToPath(module) {
      this.$emit("add-to-path", module);
    },
  },
};
</script>

<style scoped>
.modules-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  padding: 16px;
}

.module-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 16px;
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
}

.module-card:hover {
  transform: translateY(-4px);
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  margin-top: 12px;
}

.module-title {
  font-size: 0.95rem;
  font-weight: bold;
  text-align: center;
  padding: 0 8px;
  white-space: normal;
  word-wrap: break-word;
  min-height: 48px;
}

.module-info {
  padding: 0 16px;
  font-size: 0.85rem;
  text-align: left;
}

.module-description {
  margin-bottom: 8px;
  color: #555;
  min-height: 40px;
}

.module-meta {
  font-size: 0.8rem;
  color: #444;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-card-actions {
  justify-content: center;
  padding-bottom: 12px;
}
</style>
