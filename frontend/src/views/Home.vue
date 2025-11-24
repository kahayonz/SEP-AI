<template>
  <div class="home-wrapper">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="nav-left">
        <router-link to="/" class="logo">SEP-AI</router-link>
      </div>
      <div class="nav-right">
        <router-link to="/for-students" class="nav-link">For Students</router-link>
        <router-link to="/for-professors" class="nav-link">For Professors</router-link>
        <button @click="themeStore.toggleDarkMode()" class="theme-toggle">
          {{ themeStore.isDark ? '☀️' : '🌙' }}
        </button>
        <router-link to="/login" class="btn btn-secondary">Login</router-link>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            AI-Powered Code <span class="gradient-text">Evaluation</span> for Education
          </h1>
          <p class="hero-subtitle">
            Transform how professors grade projects and help students master software engineering principles with instant, intelligent feedback.
          </p>
          <div class="hero-cta">
            <router-link to="/signup" class="btn btn-primary btn-lg">Start Today</router-link>
            <router-link to="/about" class="btn btn-secondary btn-lg">Learn More</router-link>
          </div>
        </div>
        <div class="hero-visual">
          <div class="floating-card card-1">
            <div class="card-icon">📊</div>
            <div class="card-text">Code Quality</div>
          </div>
          <div class="floating-card card-2">
            <div class="card-icon">🔍</div>
            <div class="card-text">Instant Feedback</div>
          </div>
          <div class="floating-card card-3">
            <div class="card-icon">⚡</div>
            <div class="card-text">AI Analysis</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="section-header">
        <h2>Powerful Features</h2>
        <p>Everything you need for better code evaluation</p>
      </div>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">🤖</div>
          <h3>AI-Powered Grading</h3>
          <p>Advanced algorithms evaluate functionality, code quality, design patterns, and documentation adherence automatically.</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📝</div>
          <h3>Detailed Feedback</h3>
          <p>Get comprehensive, structured feedback highlighting strengths, areas for improvement, and actionable recommendations.</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🚀</div>
          <h3>Self-Evaluation Tool</h3>
          <p>Students can test and improve their code before submission with AI-powered suggestions in real-time.</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⏱️</div>
          <h3>Save Time</h3>
          <p>Professors spend 80% less time grading while providing more consistent and detailed feedback.</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📈</div>
          <h3>Track Progress</h3>
          <p>Monitor student improvement over time with detailed analytics and performance metrics.</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔒</div>
          <h3>Secure & Private</h3>
          <p>Enterprise-grade security ensures all student work and evaluations remain private and protected.</p>
        </div>
      </div>
    </section>

    <!-- Sample Evaluation Section -->
    <section class="sample-evaluation">
      <div class="section-header">
        <h2>See What You Get</h2>
        <p>Real-time AI analysis of your code</p>
      </div>
      <div class="evaluation-container">
        <div class="evaluation-card">
          <div class="evaluation-metric">
            <div class="metric-header">
              <h3>Architecture</h3>
              <span class="score">90%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 90%"></div>
            </div>
            <ul class="metric-details">
              <li>✓ Good Structure</li>
              <li>✓ Clear component separation</li>
              <li>✓ Proper design patterns</li>
            </ul>
          </div>
          <div class="evaluation-metric">
            <div class="metric-header">
              <h3>Code Quality</h3>
              <span class="score">85%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 85%"></div>
            </div>
            <ul class="metric-details">
              <li>✓ Clean, readable code</li>
              <li>✓ Good naming conventions</li>
              <li>✓ Minimal technical debt</li>
            </ul>
          </div>
          <div class="evaluation-metric">
            <div class="metric-header">
              <h3>Documentation</h3>
              <span class="score">92%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 92%"></div>
            </div>
            <ul class="metric-details">
              <li>✓ Clear comments</li>
              <li>✓ Function documentation</li>
              <li>✓ Usage examples</li>
            </ul>
          </div>
        </div>
        <div class="evaluation-info">
          <h3>Instant, Detailed Feedback</h3>
          <p>Your code is analyzed across multiple dimensions including architecture, quality, documentation, and more. Get actionable insights to improve your code and learn best practices.</p>
          <div class="eval-features">
            <div class="eval-feature">
              <div class="eval-icon">⚡</div>
              <div>
                <h4>Instant Results</h4>
                <p>Analysis completes in seconds</p>
              </div>
            </div>
            <div class="eval-feature">
              <div class="eval-icon">🎯</div>
              <div>
                <h4>Actionable Feedback</h4>
                <p>Specific suggestions for improvement</p>
              </div>
            </div>
            <div class="eval-feature">
              <div class="eval-icon">📚</div>
              <div>
                <h4>Educational</h4>
                <p>Learn industry best practices</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Comparison Section -->
    <section class="comparison">
      <div class="section-header">
        <h2>Why Choose SEP-AI?</h2>
        <p>See how we compare to traditional grading methods</p>
      </div>
      <div class="comparison-table">
        <div class="comparison-row header">
          <div class="comparison-cell">Feature</div>
          <div class="comparison-cell">Traditional</div>
          <div class="comparison-cell highlight">SEP-AI</div>
        </div>
        <div class="comparison-row">
          <div class="comparison-cell">Time per submission</div>
          <div class="comparison-cell">15-30 min</div>
          <div class="comparison-cell highlight">2-3 min</div>
        </div>
        <div class="comparison-row">
          <div class="comparison-cell">Feedback consistency</div>
          <div class="comparison-cell">Variable</div>
          <div class="comparison-cell highlight">100%</div>
        </div>
        <div class="comparison-row">
          <div class="comparison-cell">Coverage depth</div>
          <div class="comparison-cell">Basic</div>
          <div class="comparison-cell highlight">Comprehensive</div>
        </div>
        <div class="comparison-row">
          <div class="comparison-cell">Student learning</div>
          <div class="comparison-cell">Limited</div>
          <div class="comparison-cell highlight">Enhanced</div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>Ready to Transform Your Grading?</h2>
        <p>Join hundreds of educators using SEP-AI to improve student outcomes</p>
        <div class="cta-buttons">
          <router-link to="/signup" class="btn btn-primary btn-lg">Start Today</router-link>
          <router-link to="/for-professors" class="btn btn-secondary btn-lg">Learn More</router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-grid">
        <div class="footer-section">
          <h4>SEP-AI</h4>
          <p>Transforming education through intelligent code evaluation.</p>
        </div>
        <div class="footer-section">
          <h4>Product</h4>
          <ul>
            <li><router-link to="/for-students">For Students</router-link></li>
            <li><router-link to="/for-professors">For Professors</router-link></li>
            <li><router-link to="/about">About</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Account</h4>
          <ul>
            <li><router-link to="/login">Login</router-link></li>
            <li><router-link to="/signup">Sign Up</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 SEP-AI. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()
</script>

<style scoped>
.home-wrapper {
  width: 100%;
  background-color: var(--color-bg);
  overflow-x: hidden;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

html.dark .navbar {
  background: rgba(35, 35, 38, 0.7);
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.nav-left {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
  padding: 0.5rem 1rem;
}

.nav-link:hover {
  color: var(--color-primary);
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: transform 0.3s ease;
}

.theme-toggle:hover {
  transform: rotate(20deg);
}

/* Hero Section */
.hero {
  padding: 5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-text h1 {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  color: var(--color-text);
}

.gradient-text {
  background: linear-gradient(135deg, var(--color-primary) 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-cta {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.05rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  border: none;
  text-align: center;
}

.btn-primary {
  background-color: var(--color-primary);
  color: #ffffff;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
  border-color: var(--color-primary);
}

.hero-stats {
  display: flex;
  gap: 3rem;
  margin-top: 3rem;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
}

.hero-visual {
  position: relative;
  height: 400px;
}

.floating-card {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: float 3s ease-in-out infinite;
}

html.dark .floating-card {
  background: rgba(35, 35, 38, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

.card-icon {
  font-size: 2rem;
}

.card-text {
  font-weight: 600;
  font-size: 0.9rem;
}

.card-1 {
  top: 0;
  left: 0;
  animation-delay: 0s;
}

.card-2 {
  top: 150px;
  right: 0;
  animation-delay: 0.5s;
}

.card-3 {
  bottom: 0;
  left: 100px;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

/* Features Section */
.features {
  padding: 5rem 2rem;
  background: rgba(0, 0, 0, 0.02);
  max-width: 1400px;
  margin: 0 auto;
}

html.dark .features {
  background: rgba(255, 255, 255, 0.02);
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-header h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.section-header p {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.feature-item {
  padding: 2rem;
  border-radius: 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-item h3 {
  margin-bottom: 0.75rem;
  color: var(--color-text);
}

.feature-item p {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* Sample Evaluation Section */
.sample-evaluation {
  padding: 5rem 2rem;
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%);
  max-width: 1400px;
  margin: 0 auto;
}

.evaluation-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.evaluation-card {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 2.5rem;
}

.evaluation-metric {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text);
}

.score {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.progress-bar {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, #06b6d4 100%);
  transition: width 0.5s ease;
}

.metric-details {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.9rem;
}

.metric-details li {
  color: var(--color-text-secondary);
  padding: 0.3rem 0;
}

.metric-details li:before {
  content: "✓ ";
  color: var(--color-primary);
  font-weight: 700;
  margin-right: 0.5rem;
}

.evaluation-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.evaluation-info h3 {
  font-size: 2rem;
  margin: 0;
  color: var(--color-text);
}

.evaluation-info p {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.eval-features {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.eval-feature {
  display: flex;
  gap: 1rem;
}

.eval-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.eval-feature h4 {
  margin: 0 0 0.3rem 0;
  color: var(--color-text);
}

.eval-feature p {
  margin: 0;
  font-size: 0.95rem;
}

/* Comparison Section */
.comparison {
  padding: 5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.comparison-table {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  overflow: hidden;
}

.comparison-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  border-bottom: 1px solid var(--color-border);
}

.comparison-row:last-child {
  border-bottom: none;
}

.comparison-row.header {
  background: rgba(0, 0, 0, 0.02);
  font-weight: 600;
}

html.dark .comparison-row.header {
  background: rgba(255, 255, 255, 0.02);
}

.comparison-cell {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
}

.comparison-cell.highlight {
  color: var(--color-primary);
  font-weight: 600;
}

/* CTA Section */
.cta-section {
  padding: 5rem 2rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, #0891b2 100%);
  text-align: center;
  color: white;
}

.cta-content h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: white;
}

.cta-content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-buttons .btn-primary {
  background: white;
  color: var(--color-primary);
}

.cta-buttons .btn-primary:hover {
  background: rgba(255, 255, 255, 0.9);
}

.cta-buttons .btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-color: white;
}

.cta-buttons .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Footer */
.footer {
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  padding: 3rem 2rem 1rem;
}

.footer-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h4 {
  margin-bottom: 1rem;
  color: var(--color-text);
}

.footer-section p {
  color: var(--color-text-secondary);
  margin: 0;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: var(--color-primary);
}

.footer-bottom {
  max-width: 1400px;
  margin: 0 auto;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
  }

  .hero-text h1 {
    font-size: 2rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .hero-visual {
    display: none;
  }

  .nav-right {
    gap: 0.5rem;
  }

  .nav-link {
    display: none;
  }

  .comparison-row {
    grid-template-columns: 1fr;
  }

  .evaluation-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .evaluation-info h3 {
    font-size: 1.5rem;
  }
}
</style>
