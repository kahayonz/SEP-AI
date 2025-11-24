<template>
  <div class="about-page">
    <!-- Navigation -->
    <nav class="navbar">
      <div class="nav-left">
        <router-link to="/" class="logo">SEP-AI</router-link>
      </div>
      <div class="nav-right">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/for-students" class="nav-link">For Students</router-link>
        <router-link to="/for-professors" class="nav-link">For Professors</router-link>
        <button @click="themeStore.toggleDarkMode()" class="theme-toggle">
          {{ themeStore.isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <h1>About SEP-AI</h1>
      <p>Revolutionizing Software Engineering Education with Artificial Intelligence</p>
    </section>

    <!-- Main Content -->
    <main class="content">
      <!-- Mission Section -->
      <section class="section">
        <h2>Our Mission</h2>
        <p>
          SEP-AI is dedicated to transforming how software engineering principles are taught, evaluated, and learned. 
          By leveraging artificial intelligence, we provide educators with powerful tools to automate code evaluation 
          and give students meaningful feedback on their work.
        </p>
      </section>

      <!-- Why SEP-AI Section -->
      <section class="section">
        <h2>Why SEP-AI?</h2>
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon">⚡</div>
            <h3>Faster Grading</h3>
            <p>Automated evaluation of student code saves professors hours of grading time.</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">🎯</div>
            <h3>Consistent Feedback</h3>
            <p>AI provides standardized, objective evaluation based on engineering principles.</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">📈</div>
            <h3>Better Learning</h3>
            <p>Students get immediate feedback and actionable insights to improve their code.</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">🔍</div>
            <h3>Deep Analysis</h3>
            <p>Comprehensive evaluation of code quality, design patterns, and documentation.</p>
          </div>
        </div>
      </section>

      <!-- What We Evaluate Section -->
      <section class="section">
        <h2>What We Evaluate</h2>
        <div class="evaluation-list">
          <div class="eval-item">
            <h4>Code Quality</h4>
            <p>Readability, naming conventions, complexity, and adherence to best practices</p>
          </div>
          <div class="eval-item">
            <h4>Architecture & Design</h4>
            <p>Design patterns, modularity, separation of concerns, and scalability</p>
          </div>
          <div class="eval-item">
            <h4>Testing</h4>
            <p>Test coverage, test quality, and edge case handling</p>
          </div>
          <div class="eval-item">
            <h4>Documentation</h4>
            <p>Code comments, README quality, and API documentation</p>
          </div>
          <div class="eval-item">
            <h4>Security</h4>
            <p>Vulnerability detection, input validation, and secure coding practices</p>
          </div>
        </div>
      </section>

      <!-- Key Features Section -->
      <section class="section">
        <h2>Key Features</h2>
        <div class="features-list">
          <div class="feature">
            <div class="feature-number">1</div>
            <h3>Automated Code Analysis</h3>
            <p>Instantly analyze student submissions across multiple languages and frameworks</p>
          </div>
          <div class="feature">
            <div class="feature-number">2</div>
            <h3>Detailed Reports</h3>
            <p>Generate comprehensive evaluation reports with specific recommendations</p>
          </div>
          <div class="feature">
            <div class="feature-number">3</div>
            <h3>Self-Assessment Tools</h3>
            <p>Students can check their own code quality before submission</p>
          </div>
          <div class="feature">
            <div class="feature-number">4</div>
            <h3>Progress Tracking</h3>
            <p>Track improvements over time and identify learning patterns</p>
          </div>
          <div class="feature">
            <div class="feature-number">5</div>
            <h3>Multi-Language Support</h3>
            <p>Support for Python and JavaScript</p>
          </div>
          <div class="feature">
            <div class="feature-number">6</div>
            <h3>Collaborative Grading</h3>
            <p>Professors can override AI grades and add manual feedback</p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <h2>Get Started Today</h2>
        <p>Join thousands of educators and students already using SEP-AI</p>
        <div class="cta-buttons">
          <router-link to="/signup" class="btn btn-primary">Sign Up Now</router-link>
          <router-link to="/for-professors" class="btn btn-secondary">For Professors</router-link>
          <router-link to="/for-students" class="btn btn-secondary">For Students</router-link>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>SEP-AI</h4>
          <p>Making software engineering education smarter with AI</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/about">About</router-link></li>
            <li><router-link to="/for-students">For Students</router-link></li>
            <li><router-link to="/for-professors">For Professors</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Contact</h4>
          <p>Email: info@sep-ai.com</p>
          <p>Support: support@sep-ai.com</p>
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
.about-page {
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

/* Hero Section */
.hero {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-bg-secondary) 100%);
  padding: 4rem 2rem;
  text-align: center;
  color: white;
}

.hero h1 {
  font-size: var(--font-size-4xl);
  margin: 0 0 1rem 0;
}

.hero p {
  font-size: var(--font-size-lg);
  margin: 0;
  opacity: 0.9;
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
}

.section > p {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  line-height: 1.8;
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

/* Evaluation List */
.evaluation-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.eval-item {
  background-color: var(--color-bg-secondary);
  border-left: 4px solid var(--color-primary);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.eval-item h4 {
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
}

.eval-item p {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Features List */
.features-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 2rem;
  position: relative;
  transition: all 0.3s ease;
}

.feature:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-base);
}

.feature-number {
  position: absolute;
  top: -15px;
  left: 2rem;
  background-color: var(--color-primary);
  color: white;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.feature h3 {
  font-size: var(--font-size-lg);
  margin: 1.5rem 0 0.5rem 0;
  color: var(--color-text);
}

.feature p {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Stats Section */
.stats-section {
  background-color: var(--color-bg-secondary);
  border-radius: 1rem;
  padding: 3rem 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
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

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: white;
  color: var(--color-primary);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
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

.footer-section ul li {
  margin-bottom: 0.5rem;
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
    padding: 1rem;
  }

  .nav-right {
    width: 100%;
    justify-content: center;
    gap: 1rem;
  }

  .hero {
    padding: 2rem 1rem;
  }

  .hero h1 {
    font-size: var(--font-size-2xl);
  }

  .content {
    padding: 2rem 1rem;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
