<template>
  <div class="landing">
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav__container container">
        <a href="/" class="nav__logo">
          <span class="nav__logo-icon">🔗</span>
          <span class="nav__logo-text">LinkSnip</span>
        </a>
        <div class="nav__links">
          <a href="#features" class="nav__link">Features</a>
          <a href="#pricing" class="nav__link">Pricing</a>
          <router-link to="/login" class="nav__link">Login</router-link>
          <router-link to="/signup" class="btn btn--primary btn--sm">Get Started</router-link>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero__container container">
        <div class="hero__content">
          <h1 class="hero__title">
            Short links,
            <span class="hero__title-gradient">big impact</span>
          </h1>
          <p class="hero__subtitle">
            Create beautiful, trackable short links in seconds. 
            Perfect for content creators and influencers who want to 
            understand their audience.
          </p>
          <div class="hero__cta">
            <router-link to="/signup" class="btn btn--primary btn--lg">
              Start for free
            </router-link>
            <a href="#demo" class="btn btn--outline btn--lg">Try demo</a>
          </div>
          <p class="hero__note">No credit card required • Free plan available</p>
        </div>
        <div class="hero__demo" id="demo">
          <div class="demo-card">
            <h3 class="demo-card__title">Try it now</h3>
            <div class="demo-card__input-group">
              <input 
                v-model="demoUrl"
                type="url" 
                placeholder="Paste your long URL here..."
                class="demo-card__input"
              />
              <button @click="shortenDemo" class="btn btn--primary">
                Shorten
              </button>
            </div>
            <div v-if="shortenedUrl" class="demo-card__result">
              <div class="demo-card__result-url">
                <span>{{ shortenedUrl }}</span>
                <button @click="copyToClipboard" class="demo-card__copy">
                  {{ copied ? '✓' : '📋' }}
                </button>
              </div>
              <p class="demo-card__hint">Sign up to save your links and track clicks!</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="features__container container">
        <h2 class="features__title">Everything you need to grow</h2>
        <p class="features__subtitle">
          Powerful features designed for creators who want more from their links
        </p>
        <div class="features__grid">
          <div class="feature-card">
            <div class="feature-card__icon">📊</div>
            <h3 class="feature-card__title">Detailed Analytics</h3>
            <p class="feature-card__desc">
              Track clicks, see where your audience comes from, 
              and understand which content performs best.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">⚡</div>
            <h3 class="feature-card__title">Lightning Fast</h3>
            <p class="feature-card__desc">
              Our links redirect in milliseconds. 
              Your audience won't even notice.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">🎨</div>
            <h3 class="feature-card__title">Custom Links</h3>
            <p class="feature-card__desc">
              Create memorable branded links that match your style 
              and build trust with your audience.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">🌍</div>
            <h3 class="feature-card__title">Global Insights</h3>
            <p class="feature-card__desc">
              See which countries your clicks come from. 
              Understand your global reach.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">🔒</div>
            <h3 class="feature-card__title">Secure & Reliable</h3>
            <p class="feature-card__desc">
              Enterprise-grade security. Your links are always 
              available when you need them.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-card__icon">📱</div>
            <h3 class="feature-card__title">Mobile Ready</h3>
            <p class="feature-card__desc">
              Manage your links from any device. 
              Our dashboard works beautifully on mobile.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="pricing">
      <div class="pricing__container container">
        <h2 class="pricing__title">Simple, transparent pricing</h2>
        <p class="pricing__subtitle">Start free, upgrade when you're ready</p>
        <div class="pricing__grid">
          <div class="pricing-card">
            <div class="pricing-card__header">
              <h3 class="pricing-card__name">Free</h3>
              <div class="pricing-card__price">
                <span class="pricing-card__amount">$0</span>
                <span class="pricing-card__period">/month</span>
              </div>
            </div>
            <ul class="pricing-card__features">
              <li>Up to 10 short links</li>
              <li>Basic analytics</li>
              <li>7-day click history</li>
              <li>Standard support</li>
            </ul>
            <router-link to="/signup" class="btn btn--outline btn--block">
              Get started
            </router-link>
          </div>
          <div class="pricing-card pricing-card--featured">
            <div class="pricing-card__badge">Most Popular</div>
            <div class="pricing-card__header">
              <h3 class="pricing-card__name">Pro</h3>
              <div class="pricing-card__price">
                <span class="pricing-card__amount">$9</span>
                <span class="pricing-card__period">/month</span>
              </div>
            </div>
            <ul class="pricing-card__features">
              <li>Up to 500 short links</li>
              <li>Advanced analytics</li>
              <li>Unlimited click history</li>
              <li>Browser & country breakdown</li>
              <li>Priority support</li>
            </ul>
            <router-link to="/signup" class="btn btn--primary btn--block">
              Start free trial
            </router-link>
          </div>
          <div class="pricing-card">
            <div class="pricing-card__header">
              <h3 class="pricing-card__name">Enterprise</h3>
              <div class="pricing-card__price">
                <span class="pricing-card__amount">Custom</span>
              </div>
            </div>
            <ul class="pricing-card__features">
              <li>Unlimited short links</li>
              <li>Team collaboration</li>
              <li>API access</li>
              <li>Custom domains</li>
              <li>Dedicated support</li>
            </ul>
            <a href="mailto:sales@linksnip.io" class="btn btn--outline btn--block">
              Contact sales
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer__container container">
        <div class="footer__brand">
          <span class="nav__logo-icon">🔗</span>
          <span class="nav__logo-text">LinkSnip</span>
          <p class="footer__tagline">Short links, big impact.</p>
        </div>
        <div class="footer__links">
          <div class="footer__col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div class="footer__col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
          </div>
          <div class="footer__col">
            <h4>Legal</h4>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
        <div class="footer__bottom">
          <p>© 2024 LinkSnip. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const demoUrl = ref('')
const shortenedUrl = ref('')
const copied = ref(false)

function shortenDemo() {
  if (!demoUrl.value) return
  // Generate a fake short code for demo
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  shortenedUrl.value = `linksnip.io/${code}`
}

function copyToClipboard() {
  navigator.clipboard.writeText(`https://${shortenedUrl.value}`)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

// Navigation
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: $spacing-4 0;
  @include glass(0.8);

  &__container {
    @include flex-between;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 $spacing-4;

    @media (min-width: $breakpoint-lg) {
      padding: 0 $spacing-6;
    }
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
    text-decoration: none;
  }

  &__logo-icon {
    font-size: $font-size-2xl;
  }

  &__links {
    display: flex;
    align-items: center;
    gap: $spacing-6;
  }

  &__link {
    color: $gray-600;
    font-weight: $font-weight-medium;
    transition: color $transition-fast;

    &:hover {
      color: $gray-900;
    }
  }
}

// Buttons
.btn {
  @include button-base;

  &--primary {
    background: $gradient-primary;
    color: $white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
    }
  }

  &--outline {
    background: transparent;
    border: 2px solid $gray-300;
    color: $gray-700;

    &:hover {
      border-color: $primary;
      color: $primary;
    }
  }

  &--sm {
    padding: $spacing-2 $spacing-4;
    font-size: $font-size-sm;
  }

  &--lg {
    padding: $spacing-4 $spacing-8;
    font-size: $font-size-base;
  }

  &--block {
    width: 100%;
  }
}

// Hero Section
.hero {
  padding: 100px 0 $spacing-12;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #fdf4ff 100%);

  @media (min-width: $breakpoint-md) {
    padding: 120px 0 $spacing-16;
  }

  &__container {
    display: grid;
    gap: $spacing-8;

    @media (min-width: $breakpoint-md) {
      gap: $spacing-12;
    }

    @include respond-to(lg) {
      grid-template-columns: 1fr 1fr;
      align-items: center;
    }
  }

  &__content {
    text-align: center;

    @include respond-to(lg) {
      text-align: left;
    }
  }

  &__title {
    font-size: $font-size-4xl;
    font-weight: $font-weight-bold;
    line-height: 1.1;
    color: $gray-900;
    margin-bottom: $spacing-6;

    @include respond-to(md) {
      font-size: $font-size-5xl;
    }
  }

  &__title-gradient {
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__subtitle {
    font-size: $font-size-lg;
    color: $gray-600;
    max-width: 500px;
    margin: 0 auto $spacing-8;

    @include respond-to(lg) {
      margin: 0 0 $spacing-8;
    }
  }

  &__cta {
    display: flex;
    gap: $spacing-4;
    justify-content: center;
    flex-wrap: wrap;

    @include respond-to(lg) {
      justify-content: flex-start;
    }
  }

  &__note {
    margin-top: $spacing-4;
    font-size: $font-size-sm;
    color: $gray-500;
  }

  &__demo {
    @include respond-to(lg) {
      justify-self: end;
    }
  }
}

// Demo Card
.demo-card {
  @include card;
  width: 100%;
  max-width: 450px;
  margin: 0 auto;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-4;
  }

  &__input-group {
    display: flex;
    gap: $spacing-2;
  }

  &__input {
    @include input-base;
    flex: 1;
  }

  &__result {
    margin-top: $spacing-4;
    padding-top: $spacing-4;
    border-top: 1px solid $gray-200;
  }

  &__result-url {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-3 $spacing-4;
    background: $gray-50;
    border-radius: $radius-lg;
    font-family: monospace;
    color: $primary;
  }

  &__copy {
    background: none;
    border: none;
    cursor: pointer;
    font-size: $font-size-lg;
    padding: $spacing-1;
  }

  &__hint {
    margin-top: $spacing-3;
    font-size: $font-size-sm;
    color: $gray-500;
    text-align: center;
  }
}

// Features Section
.features {
  padding: $spacing-24 0;
  background: $white;

  &__container {
    text-align: center;
  }

  &__title {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
    margin-bottom: $spacing-4;
  }

  &__subtitle {
    font-size: $font-size-lg;
    color: $gray-600;
    margin-bottom: $spacing-12;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  &__grid {
    display: grid;
    gap: $spacing-6;
    text-align: left;

    @include respond-to(md) {
      grid-template-columns: repeat(2, 1fr);
    }

    @include respond-to(lg) {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

.feature-card {
  @include card;
  transition: transform $transition-base, box-shadow $transition-base;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-xl;
  }

  &__icon {
    font-size: 2.5rem;
    margin-bottom: $spacing-4;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-2;
  }

  &__desc {
    color: $gray-600;
    line-height: 1.6;
  }
}

// Pricing Section
.pricing {
  padding: $spacing-24 0;
  background: linear-gradient(180deg, $gray-50 0%, $white 100%);

  &__container {
    text-align: center;
  }

  &__title {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
    margin-bottom: $spacing-4;
  }

  &__subtitle {
    font-size: $font-size-lg;
    color: $gray-600;
    margin-bottom: $spacing-12;
  }

  &__grid {
    display: grid;
    gap: $spacing-6;
    max-width: 1000px;
    margin: 0 auto;

    @include respond-to(md) {
      grid-template-columns: repeat(3, 1fr);
      align-items: start;
    }
  }
}

.pricing-card {
  @include card;
  text-align: left;
  position: relative;

  &--featured {
    border: 2px solid $primary;
    transform: scale(1.02);

    @include respond-to(md) {
      transform: scale(1.05);
    }
  }

  &__badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: $gradient-primary;
    color: $white;
    padding: $spacing-1 $spacing-4;
    border-radius: $radius-full;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
  }

  &__header {
    margin-bottom: $spacing-6;
    padding-bottom: $spacing-6;
    border-bottom: 1px solid $gray-200;
  }

  &__name {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $gray-900;
    margin-bottom: $spacing-2;
  }

  &__price {
    display: flex;
    align-items: baseline;
    gap: $spacing-1;
  }

  &__amount {
    font-size: $font-size-4xl;
    font-weight: $font-weight-bold;
    color: $gray-900;
  }

  &__period {
    color: $gray-500;
  }

  &__features {
    list-style: none;
    margin-bottom: $spacing-6;

    li {
      padding: $spacing-2 0;
      color: $gray-600;
      display: flex;
      align-items: center;
      gap: $spacing-2;

      &::before {
        content: '✓';
        color: $success;
        font-weight: $font-weight-bold;
      }
    }
  }
}

// Footer
.footer {
  padding: $spacing-12 0 $spacing-8;
  background: $gray-900;
  color: $white;

  &__container {
    display: grid;
    gap: $spacing-8;

    @media (min-width: $breakpoint-md) {
      grid-template-columns: 1fr 2fr;
      gap: $spacing-12;
    }
  }

  &__brand {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__tagline {
    color: $gray-400;
    font-size: $font-size-sm;
  }

  &__links {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-6;

    @media (min-width: $breakpoint-md) {
      gap: $spacing-8;
      justify-items: end;
    }
  }

  &__col {
    h4 {
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: $gray-400;
      margin-bottom: $spacing-4;
    }

    a {
      display: block;
      color: $gray-300;
      padding: $spacing-2 0;
      transition: color $transition-fast;

      &:hover {
        color: $white;
      }
    }
  }

  &__bottom {
    padding-top: $spacing-8;
    border-top: 1px solid $gray-700;

    p {
      color: $gray-500;
      font-size: $font-size-sm;
    }
  }
}
</style>
