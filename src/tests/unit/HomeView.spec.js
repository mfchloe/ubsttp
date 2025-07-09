import { mount } from "@vue/test-utils";
import { nextTick } from "vue"; //  ensures Vue’s reactivity system updates are completed before making assertions.
import HomeView from "@/views/HomeView.vue";

// Mock Firebase (replace actual firebase calls so we don't rely on backend)
jest.mock("@/firebase", () => ({
  auth: {
    currentUser: { uid: "test-user-id" },
  },
  firestore: {},
}));

// Mock Firestore functions
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock chart components (replace actual chart components with stub components - a stub component is a simplified version of a component or module that replaces a more complex one during testing)
jest.mock("@/components/BarChart.vue", () => ({
  name: "BarChart",
  props: ["chartData"],
  template: '<div data-testid="bar-chart">Bar Chart</div>',
}));

jest.mock("@/components/PieChart.vue", () => ({
  name: "PieChart",
  props: ["chartData"],
  template: '<div data-testid="pie-chart">Pie Chart</div>',
}));

// Mock Vuetify components
const mockVuetifyComponents = {
  VContainer: { template: '<div class="v-container"><slot /></div>' },
  VRow: { template: '<div class="v-row"><slot /></div>' },
  VCol: { template: '<div class="v-col"><slot /></div>' },
  VCard: { template: '<div class="v-card"><slot /></div>' },
  VCardTitle: { template: '<div class="v-card-title"><slot /></div>' },
  VCardText: { template: '<div class="v-card-text"><slot /></div>' },
  VIcon: { template: '<i class="v-icon"><slot /></i>' },
};

describe("HomeView", () => {
  let wrapper;
  let mockGetDoc;

  beforeEach(() => {
    const { getDoc } = require("firebase/firestore");
    mockGetDoc = getDoc;

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  // Test 1: Component renders successfully
  test("renders the component with welcome message", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: "John Doe",
        streak: 5,
        badges: ["badge1", "badge2"],
        modulesFinished: ["module1"],
        modulesInProgress: ["module2"],
      }),
    });

    wrapper = mount(HomeView, {
      global: {
        components: {
          ...mockVuetifyComponents,
          BarChart: {
            template: '<div data-testid="bar-chart">Bar Chart</div>',
          },
          PieChart: {
            template: '<div data-testid="pie-chart">Pie Chart</div>',
          },
        },
      },
    });

    await nextTick();

    expect(wrapper.find("h1").text()).toContain("Welcome to TTP");
    expect(wrapper.find('[data-testid="bar-chart"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pie-chart"]').exists()).toBe(true);
  });

  // Test 2: Displays user data correctly
  test("displays user data correctly when loaded", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: "Jane Smith",
        streak: 10,
        badges: ["badge1", "badge2", "badge3"],
        modulesFinished: ["module1", "module2"],
        modulesInProgress: ["module3"],
      }),
    });

    wrapper = mount(HomeView, {
      global: {
        components: mockVuetifyComponents,
      },
    });

    await nextTick();
    // Allow some time for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.vm.userName).toBe("Jane Smith");
    expect(wrapper.vm.streak).toBe(10);
    expect(wrapper.vm.badgesCount).toBe(3);
    expect(wrapper.vm.modulesFinished).toEqual(["module1", "module2"]);
    expect(wrapper.vm.modulesInProgress).toEqual(["module3"]);
  });

  // Test 3: Calculates total modules correctly
  test("calculates total modules correctly", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: "Test User",
        modulesFinished: ["module1", "module2", "module3"],
        modulesInProgress: ["module4", "module5"],
      }),
    });

    wrapper = mount(HomeView, {
      global: {
        components: mockVuetifyComponents,
      },
    });

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.vm.totalModules).toBe(5);
  });

  // Test 4: Handles missing user data
  test("handles missing user data with default values", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({}), // Empty user data
    });

    wrapper = mount(HomeView, {
      global: {
        components: mockVuetifyComponents,
      },
    });

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.vm.userName).toBe("User");
    expect(wrapper.vm.streak).toBe(0);
    expect(wrapper.vm.badgesCount).toBe(0);
    expect(wrapper.vm.modulesFinished).toEqual([]);
    expect(wrapper.vm.modulesInProgress).toEqual([]);
    expect(wrapper.vm.totalModules).toBe(0);
  });

  // Test 5: Initializes chart data correctly
  test("initializes chart data with correct structure", () => {
    wrapper = mount(HomeView, {
      global: {
        components: mockVuetifyComponents,
      },
    });

    expect(wrapper.vm.difficultyChartData).toEqual({
      labels: ["Easy", "Intermediate", "Hard"],
      datasets: [
        {
          label: "Modules",
          data: [0, 0, 0],
          backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
        },
      ],
    });

    expect(wrapper.vm.skillsChartData).toEqual({
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#8BC34A",
            "#90A4AE",
            "#EA80FC",
            "#00E676",
          ],
        },
      ],
    });
  });

  // Test 6: Handles Firebase error gracefully
  test("handles Firebase error gracefully", async () => {
    mockGetDoc.mockRejectedValue(new Error("Firebase error"));

    // Mock console.error to avoid error output in tests
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    wrapper = mount(HomeView, {
      global: {
        components: mockVuetifyComponents,
      },
    });

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Component should still render with default values
    expect(wrapper.vm.userName).toBe("User");
    expect(wrapper.vm.streak).toBe(0);
    expect(wrapper.vm.badgesCount).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching user data:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
