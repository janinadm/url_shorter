<template>
  <div class="dashboard">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <router-link to="/dashboard" class="sidebar__logo">
        <Logo />
      </router-link>

      <nav class="sidebar__nav">
        <router-link to="/dashboard" class="sidebar__link" @click="sidebarOpen = false">
          <span class="sidebar__link-icon"><LayoutDashboard :size="20" /></span>
          Dashboard
        </router-link>
        <router-link to="/dashboard/settings" class="sidebar__link" @click="sidebarOpen = false">
          <span class="sidebar__link-icon"><Settings :size="20" /></span>
          Settings
        </router-link>
      </nav>

      <div class="sidebar__footer">
        <button @click="goBack" class="sidebar__back">
          <ArrowLeft :size="16" /> Back to Dashboard
        </button>
      </div>
    </aside>

    <main class="main">
      <header class="header">
        <button class="header__menu-btn" @click="sidebarOpen = !sidebarOpen">
          <Menu :size="24" />
        </button>
        <h1 class="header__title">Analytics</h1>
        <p v-if="url" class="header__subtitle">
          {{ url.title || url.shortCode }} • {{ baseUrl }}/r/{{ url.shortCode }}
        </p>
      </header>

      <div class="content">
        <div v-if="loading" class="loading">Loading analytics...</div>
        
        <template v-else-if="analytics">
          <!-- Stats Overview -->
          <div class="stats">
            <div class="stat-card">
              <div class="stat-card__icon"><MousePointerClick :size="24" /></div>
              <div class="stat-card__content">
                <p class="stat-card__value">{{ analytics.totalClicks }}</p>
                <p class="stat-card__label">Total Clicks</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon"><TrendingUp :size="24" /></div>
              <div class="stat-card__content">
                <p class="stat-card__value">{{ averageClicks }}</p>
                <p class="stat-card__label">Avg. Daily Clicks</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon"><Globe :size="24" /></div>
              <div class="stat-card__content">
                <p class="stat-card__value">{{ topCountry }}</p>
                <p class="stat-card__label">Top Country</p>
              </div>
            </div>
          </div>

          <div class="charts">
            <!-- Clicks Over Time -->
            <div class="chart-card chart-card--wide">
              <h3 class="chart-card__title">Clicks Over Time</h3>
              <div class="chart-card__content">
                <canvas ref="lineChartRef"></canvas>
              </div>
            </div>

            <!-- Browser Breakdown -->
            <div class="chart-card">
              <h3 class="chart-card__title">Browser Breakdown</h3>
              <div class="chart-card__content">
                <canvas ref="browserChartRef"></canvas>
              </div>
            </div>

            <!-- Country Breakdown -->
            <div class="chart-card">
              <h3 class="chart-card__title">Country Breakdown</h3>
              <div class="chart-card__content">
                <canvas ref="countryChartRef"></canvas>
              </div>
            </div>

            <!-- Pro Analytics Section -->
            <template v-if="isPro">
              <!-- Peak Hours -->
              <div class="chart-card chart-card--wide">
                <h3 class="chart-card__title">📅 Best Times to Post</h3>
                <div class="chart-card__content">
                  <canvas ref="hoursChartRef"></canvas>
                </div>
              </div>

              <!-- Top Referrers -->
              <div class="chart-card">
                <h3 class="chart-card__title">🔗 Top Referrers</h3>
                <div class="chart-card__content">
                  <canvas ref="referrersChartRef"></canvas>
                </div>
              </div>

              <!-- Unique Visitors -->
              <div class="chart-card">
                <h3 class="chart-card__title">👥 Unique Visitors</h3>
                <div class="chart-card__content chart-card__content--centered">
                  <div class="unique-visitors">
                    <span class="unique-visitors__number">{{ analytics?.uniqueVisitors || 0 }}</span>
                    <span class="unique-visitors__label">unique visitors</span>
                    <span class="unique-visitors__total">out of {{ analytics?.totalClicks || 0 }} total clicks</span>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Upgrade Banner for Free users -->
          <div v-if="analytics?.isLimited" class="upgrade-banner">
            <div class="upgrade-banner__icon"><BarChart2 :size="32" /></div>
            <div class="upgrade-banner__content">
              <h4>Showing last 3 days only</h4>
              <p>Upgrade to Pro for full history, best posting times, referrer analytics, and unique visitors</p>
            </div>
            <router-link to="/dashboard/settings" class="upgrade-banner__btn">
              Upgrade to Pro
            </router-link>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUrlStore } from '@/stores/urls'
import { useAuthStore } from '@/stores/auth'
import { useAnalyticsStore } from '@/stores/analytics'
import { Chart, registerables } from 'chart.js'
import Logo from '@/components/Logo.vue'
import { 
  LayoutDashboard, 
  Settings, 
  ArrowLeft, 
  Menu, 
  MousePointerClick, 
  TrendingUp, 
  Globe,
  BarChart2
} from 'lucide-vue-next'

Chart.register(...registerables)

const route = useRoute()
const router = useRouter()
const urlStore = useUrlStore()
const authStore = useAuthStore()
const analyticsStore = useAnalyticsStore()

const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin

const lineChartRef = ref<HTMLCanvasElement | null>(null)
const browserChartRef = ref<HTMLCanvasElement | null>(null)
const countryChartRef = ref<HTMLCanvasElement | null>(null)
const hoursChartRef = ref<HTMLCanvasElement | null>(null)
const referrersChartRef = ref<HTMLCanvasElement | null>(null)
const sidebarOpen = ref(false)

let lineChart: Chart | null = null
let browserChart: Chart | null = null
let countryChart: Chart | null = null
let hoursChart: Chart | null = null
let referrersChart: Chart | null = null

const urlId = computed(() => route.params.id as string)
const url = computed(() => urlStore.urls.find(u => u.id === urlId.value))
const analytics = computed(() => analyticsStore.data)
const loading = computed(() => analyticsStore.loading)

const averageClicks = computed(() => {
  if (!analytics.value || analytics.value.clicksByDate.length === 0) return 0
  return Math.round(analytics.value.totalClicks / analytics.value.clicksByDate.length)
})

const topCountry = computed(() => {
  if (!analytics.value || analytics.value.clicksByCountry.length === 0) return 'N/A'
  return analytics.value.clicksByCountry[0]?.country ?? 'N/A'
})

const isPro = computed(() => 
  authStore.user?.plan === 'pro' || authStore.user?.plan === 'enterprise'
)

function goBack() {
  router.push('/dashboard')
}

function createCharts() {
  if (!analytics.value) return

  // Always destroy existing charts before creating new ones
  destroyCharts()

  // Line chart - Clicks over time
  if (lineChartRef.value) {
    lineChart = new Chart(lineChartRef.value, {
      type: 'line',
      data: {
        labels: analytics.value.clicksByDate.map(d => d.date),
        datasets: [{
          label: 'Clicks',
          data: analytics.value.clicksByDate.map(d => d.clicks),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true }
        }
      }
    })
  }

  // Doughnut chart - Browser breakdown
  if (browserChartRef.value) {
    browserChart = new Chart(browserChartRef.value, {
      type: 'doughnut',
      data: {
        labels: analytics.value.clicksByBrowser.map(d => d.browser),
        datasets: [{
          data: analytics.value.clicksByBrowser.map(d => d.clicks),
          backgroundColor: ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b', '#10b981']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    })
  }

  // Bar chart - Country breakdown
  if (countryChartRef.value) {
    countryChart = new Chart(countryChartRef.value, {
      type: 'bar',
      data: {
        labels: analytics.value.clicksByCountry.map(d => d.country),
        datasets: [{
          label: 'Clicks',
          data: analytics.value.clicksByCountry.map(d => d.clicks),
          backgroundColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true }
        }
      }
    })
  }

  // Bar chart - Clicks by hour (Pro only)
  if (hoursChartRef.value && analytics.value.clicksByHour) {
    hoursChart = new Chart(hoursChartRef.value, {
      type: 'bar',
      data: {
        labels: analytics.value.clicksByHour.map(d => `${d.hour}:00`),
        datasets: [{
          label: 'Clicks',
          data: analytics.value.clicksByHour.map(d => d.clicks),
          backgroundColor: '#10b981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true }
        }
      }
    })
  }

  // Horizontal bar chart - Top referrers (Pro only)
  if (referrersChartRef.value && analytics.value.topReferrers) {
    referrersChart = new Chart(referrersChartRef.value, {
      type: 'bar',
      data: {
        labels: analytics.value.topReferrers.map(d => d.referrer),
        datasets: [{
          label: 'Clicks',
          data: analytics.value.topReferrers.map(d => d.clicks),
          backgroundColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } }
      }
    })
  }
}

function destroyCharts() {
  if (lineChart) {
    lineChart.destroy()
    lineChart = null
  }
  if (browserChart) {
    browserChart.destroy()
    browserChart = null
  }
  if (countryChart) {
    countryChart.destroy()
    countryChart = null
  }
  if (hoursChart) {
    hoursChart.destroy()
    hoursChart = null
  }
  if (referrersChart) {
    referrersChart.destroy()
    referrersChart = null
  }
}

// Watch for data changes to update charts automatically (e.g. from Realtime updates)
watch(analytics, () => {
  if (analytics.value) {
    createCharts()
  }
}, { deep: true })

// Fetch analytics when component mounts
onMounted(async () => {
  const id = urlId.value
  if (!id) return
  
  if (urlStore.urls.length === 0) {
    await urlStore.fetchUrls()
  }
  
  await analyticsStore.fetchAnalytics(id)
  analyticsStore.subscribeToRealtime(id)
  setTimeout(createCharts, 100)
})

// Also watch for urlId changes (e.g., navigating between different link analytics)
watch(urlId, async (id, oldId) => {
  if (!id || id === oldId) return
  
  if (urlStore.urls.length === 0) {
    await urlStore.fetchUrls()
  }
  
  await analyticsStore.fetchAnalytics(id)
  analyticsStore.subscribeToRealtime(id)
  setTimeout(createCharts, 100)
})

onUnmounted(() => {
  destroyCharts()
  analyticsStore.clearAnalytics()
})
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

.dashboard {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  background: $white;
  border-right: 1px solid $gray-200;
  padding: $spacing-6;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  z-index: 100;

  @media (max-width: $breakpoint-md) {
    transform: translateX(-100%);
    transition: transform $transition-base;
  }

  &--open {
    transform: translateX(0);
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
    text-decoration: none;
    margin-bottom: $spacing-8;
  }

  &__logo-icon {
    font-size: $font-size-2xl;
  }

  &__nav {
    flex: 1;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    border-radius: $radius-lg;
    color: $gray-600;
    text-decoration: none;
    font-weight: $font-weight-medium;
    transition: all $transition-fast;
    margin-bottom: $spacing-1;

    &:hover {
      background: $gray-100;
      color: $gray-900;
    }
  }

  &__link-icon {
    font-size: $font-size-lg;
  }

  &__footer {
    border-top: 1px solid $gray-200;
    padding-top: $spacing-4;
  }

  &__back {
    width: 100%;
    padding: $spacing-3 $spacing-4;
    background: transparent;
    border: 1px solid $gray-300;
    border-radius: $radius-md;
    color: $gray-600;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $primary;
      color: $primary;
    }
  }
}

.sidebar-overlay {
  display: none;
  
  @media (max-width: $breakpoint-md) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
}

.main {
  flex: 1;
  margin-left: 260px;
  background: $gray-50;
  min-height: 100vh;
  width: calc(100% - 260px);

  @media (max-width: $breakpoint-md) {
    margin-left: 0;
    width: 100%;
  }
}

.header {
  background: $white;
  border-bottom: 1px solid $gray-200;
  padding: $spacing-4 $spacing-6;
  display: flex;
  align-items: center;
  gap: $spacing-4;

  @media (min-width: $breakpoint-md) {
    padding: $spacing-6 $spacing-8;
  }

  &__menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: 1px solid $gray-300;
    border-radius: $radius-md;
    font-size: $font-size-xl;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $gray-100;
    }

    @media (min-width: $breakpoint-md) {
      display: none;
    }
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;

    @media (min-width: $breakpoint-md) {
      font-size: $font-size-2xl;
    }
  }

  &__subtitle {
    color: $gray-500;
    margin-top: $spacing-1;
    font-size: $font-size-sm;
    
    @media (min-width: $breakpoint-md) {
      font-size: $font-size-base;
    }
  }
}

.content {
  padding: $spacing-4;
  
  @media (min-width: $breakpoint-md) {
    padding: $spacing-8;
  }
}

.loading {
  text-align: center;
  padding: $spacing-12;
  color: $gray-500;
}

.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-4;
  margin-bottom: $spacing-6;

  @media (min-width: $breakpoint-sm) {
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-6;
    margin-bottom: $spacing-8;
  }
}

.stat-card {
  @include card;
  display: flex;
  align-items: center;
  gap: $spacing-3;
  padding: $spacing-4;

  @media (min-width: $breakpoint-md) {
    gap: $spacing-4;
    padding: $spacing-6;
  }

  &__icon {
    font-size: 1.5rem;
    padding: $spacing-2;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($secondary, 0.1) 100%);
    border-radius: $radius-lg;

    @media (min-width: $breakpoint-md) {
      font-size: 2rem;
      padding: $spacing-3;
    }
  }

  &__value {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;

    @media (min-width: $breakpoint-md) {
      font-size: $font-size-2xl;
    }
  }

  &__label {
    font-size: $font-size-xs;
    color: $gray-500;

    @media (min-width: $breakpoint-md) {
      font-size: $font-size-sm;
    }
  }
}

.charts {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-4;

  @media (min-width: $breakpoint-lg) {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-6;
  }
}

.chart-card {
  @include card;
  padding: $spacing-4;

  @media (min-width: $breakpoint-md) {
    padding: $spacing-6;
  }

  &--wide {
    grid-column: 1 / -1;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-4;
  }

  &__content {
    height: 250px;
    position: relative;
  }
}

.upgrade-banner {
  @include card;
  display: flex;
  align-items: center;
  gap: $spacing-4;
  padding: $spacing-4 $spacing-6;
  margin-top: $spacing-6;
  background: linear-gradient(135deg, rgba($primary, 0.05), rgba($primary, 0.1));
  border: 1px solid rgba($primary, 0.2);

  @media (max-width: $breakpoint-md) {
    flex-direction: column;
    text-align: center;
  }

  &__icon {
    font-size: 2rem;
  }

  &__content {
    flex: 1;

    h4 {
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: $gray-900;
      margin-bottom: $spacing-1;
    }

    p {
      font-size: $font-size-sm;
      color: $gray-600;
    }
  }

  &__btn {
    padding: $spacing-2 $spacing-4;
    background: $primary;
    color: $white;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    text-decoration: none;
    transition: background $transition-fast;

    &:hover {
      background: color.adjust($primary, $lightness: -10%);
    }
  }
}

.unique-visitors {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;

  &__number {
    font-size: 3.5rem;
    font-weight: $font-weight-bold;
    color: $primary;
    line-height: 1;
  }

  &__label {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $gray-700;
    margin-top: $spacing-2;
  }

  &__total {
    font-size: $font-size-sm;
    color: $gray-500;
    margin-top: $spacing-1;
  }
}

.chart-card__content--centered {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
