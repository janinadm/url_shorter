<template>
  <div class="dashboard">
    <aside class="sidebar">
      <router-link to="/" class="sidebar__logo">
        <span class="sidebar__logo-icon">🔗</span>
        <span class="sidebar__logo-text">LinkSnip</span>
      </router-link>

      <nav class="sidebar__nav">
        <router-link to="/dashboard" class="sidebar__link">
          <span class="sidebar__link-icon">📊</span>
          Dashboard
        </router-link>
        <router-link to="/dashboard/settings" class="sidebar__link">
          <span class="sidebar__link-icon">⚙️</span>
          Settings
        </router-link>
      </nav>

      <div class="sidebar__footer">
        <button @click="goBack" class="sidebar__back">
          ← Back to Dashboard
        </button>
      </div>
    </aside>

    <main class="main">
      <header class="header">
        <h1 class="header__title">Analytics</h1>
        <p v-if="url" class="header__subtitle">
          {{ url.title || url.shortCode }} • linksnip.io/{{ url.shortCode }}
        </p>
      </header>

      <div class="content">
        <div v-if="loading" class="loading">Loading analytics...</div>
        
        <template v-else-if="analytics">
          <!-- Stats Overview -->
          <div class="stats">
            <div class="stat-card">
              <div class="stat-card__icon">👆</div>
              <div class="stat-card__content">
                <p class="stat-card__value">{{ analytics.totalClicks }}</p>
                <p class="stat-card__label">Total Clicks</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">📈</div>
              <div class="stat-card__content">
                <p class="stat-card__value">{{ averageClicks }}</p>
                <p class="stat-card__label">Avg. Daily Clicks</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">🌍</div>
              <div class="stat-card__content">
                <p class="stat-card__value">{{ topCountry }}</p>
                <p class="stat-card__label">Top Country</p>
              </div>
            </div>
          </div>

          <!-- Charts Grid -->
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
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUrlStore } from '@/stores/urls'
import { useAnalyticsStore } from '@/stores/analytics'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const route = useRoute()
const router = useRouter()
const urlStore = useUrlStore()
const analyticsStore = useAnalyticsStore()

const lineChartRef = ref<HTMLCanvasElement | null>(null)
const browserChartRef = ref<HTMLCanvasElement | null>(null)
const countryChartRef = ref<HTMLCanvasElement | null>(null)

let lineChart: Chart | null = null
let browserChart: Chart | null = null
let countryChart: Chart | null = null

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

function goBack() {
  router.push('/dashboard')
}

function createCharts() {
  if (!analytics.value) return

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
}

function destroyCharts() {
  lineChart?.destroy()
  browserChart?.destroy()
  countryChart?.destroy()
}

watch(analytics, () => {
  destroyCharts()
  setTimeout(createCharts, 100)
})

onMounted(async () => {
  await urlStore.fetchUrls()
  await analyticsStore.fetchAnalytics(urlId.value)
  setTimeout(createCharts, 100)
})

onUnmounted(() => {
  destroyCharts()
  analyticsStore.clearAnalytics()
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

.dashboard {
  display: grid;
  grid-template-columns: 260px 1fr;
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

.main {
  margin-left: 260px;
  background: $gray-50;
  min-height: 100vh;
}

.header {
  background: $white;
  border-bottom: 1px solid $gray-200;
  padding: $spacing-6 $spacing-8;

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
  }

  &__subtitle {
    color: $gray-500;
    margin-top: $spacing-1;
  }
}

.content {
  padding: $spacing-8;
}

.loading {
  text-align: center;
  padding: $spacing-12;
  color: $gray-500;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-6;
  margin-bottom: $spacing-8;
}

.stat-card {
  @include card;
  display: flex;
  align-items: center;
  gap: $spacing-4;

  &__icon {
    font-size: 2rem;
    padding: $spacing-3;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($secondary, 0.1) 100%);
    border-radius: $radius-lg;
  }

  &__value {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
  }

  &__label {
    font-size: $font-size-sm;
    color: $gray-500;
  }
}

.charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-6;
}

.chart-card {
  @include card;

  &--wide {
    grid-column: span 2;
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
</style>
