<template>
  <div class="for-students-page">
    <!-- Navigation -->
    <nav class="navbar">
      <div class="nav-left">
        <router-link to="/" class="logo">SEP-AI</router-link>
      </div>
      <div class="nav-right">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/about" class="nav-link">About</router-link>
        <router-link to="/for-professors" class="nav-link">For Professors</router-link>
        <button @click="themeStore.toggleDarkMode()" class="theme-toggle">
          {{ themeStore.isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <h1>Unlock Your Full Coding Potential</h1>
      <p>Get AI-powered feedback on your code to become a better developer</p>
      <router-link to="/signup" class="btn btn-primary btn-large">Start Today</router-link>
    </section>

    <!-- Main Content -->
    <main class="content">
      <!-- Key Benefits -->
      <section class="section">
        <h2>Why Students Love SEP-AI</h2>
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon">🚀</div>
            <h3>Rapid Feedback</h3>
            <p>Get instant analysis of your code instead of waiting days for grades</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">📚</div>
            <h3>Learn Best Practices</h3>
            <p>Understand industry-standard coding patterns and conventions</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">🎯</div>
            <h3>Improve Incrementally</h3>
            <p>Track your progress over time and see your skills grow</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">💪</div>
            <h3>Build Confidence</h3>
            <p>Check your code quality before submitting to your professor</p>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="section">
        <h2>How It Works</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h3>Write Your Code</h3>
            <p>Develop your project using your favorite language and tools</p>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <h3>Submit to SEP-AI</h3>
            <p>Upload your project files through our simple web interface</p>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <h3>Get AI Analysis</h3>
            <p>Receive detailed feedback in seconds, not days</p>
          </div>
          <div class="step">
            <div class="step-number">4</div>
            <h3>Improve & Resubmit</h3>
            <p>Use the feedback to enhance your code and resubmit</p>
          </div>
        </div>
      </section>

      <!-- What You'll Learn -->
      <section class="section">
        <h2>What You'll Master</h2>
        <div class="skills-grid">
          <div class="skill-card">
            <h3>Code Quality</h3>
            <ul>
              <li>Writing clean, readable code</li>
              <li>Following naming conventions</li>
              <li>Reducing complexity</li>
              <li>Best practices for your language</li>
            </ul>
          </div>
          <div class="skill-card">
            <h3>Architecture & Design</h3>
            <ul>
              <li>Design patterns</li>
              <li>SOLID principles</li>
              <li>Module organization</li>
              <li>Scalability considerations</li>
            </ul>
          </div>
          <div class="skill-card">
            <h3>Professional Skills</h3>
            <ul>
              <li>Testing strategies</li>
              <li>Documentation</li>
              <li>Security practices</li>
              <li>Error handling</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Supported Languages -->
      <section class="section">
        <h2>Languages We Support</h2>
        <div class="languages">
          <div class="language">Python</div>
          <div class="language">JavaScript</div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <h2>Ready to Become a Better Developer?</h2>
        <p>Join thousands of students already improving their skills with SEP-AI</p>
        <router-link to="/signup" class="btn btn-primary btn-large">Start Today</router-link>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>SEP-AI</h4>
          <p>Making software engineering education smarter</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/about">About</router-link></li>
            <li><router-link to="/for-professors">For Professors</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Support</h4>
          <p>Email: support@sep-ai.com</p>
          <p>Discord: Join our community</p>
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
.for-students-page {
  min-height: 100vh;
  background-color: var(--color-bg);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

/* Navigation */
.navbar {
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.nav-left {
  display: flex;
  align-items: center;
}

.logo {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.3s ease;
}

.logo:hover {
  color: var(--color-primary-hover);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: var(--color-text);
  text-decoration: none;
  transition: color 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  color: var(--color-primary);
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.3s ease;
}

.theme-toggle:hover {
  background-color: var(--color-border-light);
}

/* Hero */
.hero {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-bg-secondary) 100%);
  padding: 5rem 2rem;
  text-align: center;
  color: white;
}

.hero h1 {
  font-size: var(--font-size-4xl);
  margin: 0 0 1rem 0;
}

.hero p {
  font-size: var(--font-size-lg);
  margin: 0 0 2rem 0;
  opacity: 0.9;
}

.btn-large {
  display: inline-block;
  padding: 1rem 2rem;
  font-size: 1.05rem;
}

/* Content */
.content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section h2 {
  font-size: var(--font-size-3xl);
  color: var(--color-text);
  margin: 0;
  text-align: center;
}

/* Benefits Grid */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.benefit-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.benefit-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-base);
  border-color: var(--color-primary);
}

.benefit-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.benefit-card h3 {
  font-size: var(--font-size-lg);
  margin: 0 0 0.5rem 0;
  color: var(--color-text);
}

.benefit-card p {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Steps */
.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.step {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  position: relative;
}

.step-number {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-primary);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.step h3 {
  font-size: var(--font-size-lg);
  margin: 1.5rem 0 0.5rem 0;
  color: var(--color-text);
}

.step p {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Skills Grid */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.skill-card {
  background-color: var(--color-bg-secondary);
  border-left: 4px solid var(--color-primary);
  border-radius: 0.5rem;
  padding: 2rem;
}

.skill-card h3 {
  color: var(--color-text);
  margin: 0 0 1rem 0;
  font-size: var(--font-size-lg);
}

.skill-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.skill-card li {
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  position: relative;
}

.skill-card li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-weight: bold;
}

/* Testimonials */
.testimonials {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

/* Languages */
.languages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.language {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  font-weight: 500;
  color: var(--color-text);
  transition: all 0.3s ease;
}

.language:hover {
  border-color: var(--color-primary);
  background-color: var(--color-border-light);
  transform: translateY(-2px);
}

/* Pricing */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.pricing-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  text-align: center;
  transition: all 0.3s ease;
}

.pricing-card.featured {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
  transform: scale(1.05);
}

.pricing-card h3 {
  font-size: var(--font-size-xl);
  margin: 0 0 1rem 0;
  color: var(--color-text);
}

.price {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-bg-secondary) 100%);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  color: white;
}

.cta-section h2 {
  color: white;
  margin: 0 0 0.5rem 0;
}

.cta-section p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 2rem 0;
  font-size: var(--font-size-lg);
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-text);
  border: 2px solid var(--color-border);
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.cta-section .btn-primary {
  background-color: white;
  color: var(--color-primary);
}

.cta-section .btn-primary:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

/* Footer */
.footer {
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  padding: 3rem 2rem 1rem;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h4 {
  color: var(--color-text);
  margin: 0 0 1rem 0;
}

.footer-section p {
  color: var(--color-text-secondary);
  margin: 0.5rem 0;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section a {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: var(--color-primary);
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-right {
    width: 100%;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .hero {
    padding: 3rem 1rem;
  }

  .hero h1 {
    font-size: var(--font-size-2xl);
  }

  .content {
    padding: 2rem 1rem;
  }

  .pricing-card.featured {
    transform: scale(1);
  }

  .section h2 {
    text-align: left;
  }
}
</style>
