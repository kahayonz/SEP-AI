<template>
  <div class="for-professors-page">
    <!-- Navigation -->
    <nav class="navbar">
      <div class="nav-left">
        <router-link to="/" class="logo">SEP-AI</router-link>
      </div>
      <div class="nav-right">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/about" class="nav-link">About</router-link>
        <router-link to="/for-students" class="nav-link">For Students</router-link>
        <button @click="themeStore.toggleDarkMode()" class="theme-toggle">
          {{ themeStore.isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <h1>Revolutionize Your Grading Process</h1>
      <p>Save hours every week with AI-powered code evaluation while maintaining academic integrity</p>
      <router-link to="/signup" class="btn btn-primary btn-large">Start Today</router-link>
    </section>

    <!-- Main Content -->
    <main class="content">
      <!-- Key Benefits -->
      <section class="section">
        <h2>Save Time, Improve Learning</h2>
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon">⏱️</div>
            <h3>Save Hours Weekly</h3>
            <p>Automated grading reduces grading time by up to 80%, freeing you for mentoring</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">📊</div>
            <h3>Consistent Grading</h3>
            <p>AI ensures objective, standardized evaluation across all student submissions</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">📈</div>
            <h3>Better Insights</h3>
            <p>Comprehensive analytics help you identify struggling students early</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon">🎓</div>
            <h3>Improved Learning</h3>
            <p>Immediate feedback helps students learn faster and code better</p>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="section">
        <h2>How SEP-AI Works for Professors</h2>
        <div class="workflow">
          <div class="workflow-step">
            <div class="step-number">1</div>
            <h3>Create Assignments</h3>
            <p>Define assignment requirements and grading rubrics in the dashboard</p>
          </div>
          <div class="workflow-step">
            <div class="step-number">2</div>
            <h3>Share with Students</h3>
            <p>Students submit their code through SEP-AI in one click</p>
          </div>
          <div class="workflow-step">
            <div class="step-number">3</div>
            <h3>AI Evaluation</h3>
            <p>SEP-AI instantly analyzes code against your rubric and standards</p>
          </div>
          <div class="workflow-step">
            <div class="step-number">4</div>
            <h3>Review & Override</h3>
            <p>Review AI grades and add manual feedback where needed</p>
          </div>
          <div class="workflow-step">
            <div class="step-number">5</div>
            <h3>Provide Feedback</h3>
            <p>Students receive detailed feedback and grades instantly</p>
          </div>
        </div>
      </section>

      <!-- Key Features -->
      <section class="section">
        <h2>Powerful Features for Educators</h2>
        <div class="features-grid">
          <div class="feature">
            <h3>🎯 Custom Rubrics</h3>
            <p>Create custom evaluation criteria tailored to your course learning objectives</p>
          </div>
          <div class="feature">
            <h3>📊 Class Analytics</h3>
            <p>See class-wide statistics, common mistakes, and learning trends</p>
          </div>
          <div class="feature">
            <h3>👥 Multi-Class Management</h3>
            <p>Manage multiple courses and class sections from a single dashboard</p>
          </div>
          <div class="feature">
            <h3>🔄 Grade Override</h3>
            <p>Manually adjust AI grades and add personalized feedback</p>
          </div>
          <div class="feature">
            <h3>📈 Progress Tracking</h3>
            <p>Track student progress over the semester with detailed reports</p>
          </div>
          <div class="feature">
            <h3>🔐 Privacy & Security</h3>
            <p>FERPA-compliant with enterprise-grade security for student data</p>
          </div>
          <div class="feature">
            <h3>🔗 LMS Integration</h3>
            <p>Integrates with Canvas, Blackboard, D2L, and other major LMS platforms</p>
          </div>
          <div class="feature">
            <h3>📥 Batch Operations</h3>
            <p>Import student lists and create assignments in bulk</p>
          </div>
        </div>
      </section>

      <!-- Evaluation Criteria -->
      <section class="section">
        <h2>Comprehensive Code Evaluation</h2>
        <p style="text-align: center; color: var(--color-text-secondary);">
          SEP-AI evaluates all aspects of code quality that matter for software engineering education
        </p>
        <div class="evaluation-grid">
          <div class="eval-card">
            <h4>Code Quality & Style</h4>
            <ul>
              <li>Readability and formatting</li>
              <li>Naming conventions</li>
              <li>Code complexity (cyclomatic)</li>
              <li>DRY principle adherence</li>
            </ul>
          </div>
          <div class="eval-card">
            <h4>Design & Architecture</h4>
            <ul>
              <li>Design pattern usage</li>
              <li>SOLID principles</li>
              <li>Module cohesion</li>
              <li>Coupling analysis</li>
            </ul>
          </div>
          <div class="eval-card">
            <h4>Testing</h4>
            <ul>
              <li>Test coverage</li>
              <li>Test quality</li>
              <li>Edge case handling</li>
              <li>Mock usage</li>
            </ul>
          </div>
          <div class="eval-card">
            <h4>Documentation</h4>
            <ul>
              <li>Code comments</li>
              <li>Function documentation</li>
              <li>README quality</li>
              <li>API docs</li>
            </ul>
          </div>
          <div class="eval-card">
            <h4>Security & Best Practices</h4>
            <ul>
              <li>Vulnerability detection</li>
              <li>Input validation</li>
              <li>Error handling</li>
              <li>Security patterns</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Supported Languages -->
      <section class="section">
        <h2>Support for All Major Languages</h2>
        <div class="languages">
          <div class="language">Python</div>
          <div class="language">JavaScript</div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <h2>Ready to Transform Your Grading?</h2>
        <p>Start using SEP-AI today. Completely free for all educators.</p>
        <router-link to="/signup" class="btn btn-primary btn-large">Start Today</router-link>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>SEP-AI</h4>
          <p>Transforming software engineering education</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/about">About</router-link></li>
            <li><router-link to="/for-students">For Students</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Support</h4>
          <p>Email: support@sep-ai.com</p>
          <p>Phone: +1 (800) SEP-AI-1</p>
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
.for-professors-page {
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

.section > p {
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

/* Workflow */
.workflow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.workflow-step {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 2rem 1.5rem;
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

.workflow-step h3 {
  font-size: var(--font-size-lg);
  margin: 1.5rem 0 0.5rem 0;
  color: var(--color-text);
}

.workflow-step p {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature {
  background-color: var(--color-bg-secondary);
  border-left: 4px solid var(--color-primary);
  border-radius: 0.5rem;
  padding: 2rem;
}

.feature h3 {
  color: var(--color-text);
  margin: 0 0 0.75rem 0;
  font-size: 1.05rem;
}

.feature p {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Evaluation Grid */
.evaluation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.eval-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.eval-card h4 {
  color: var(--color-text);
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.eval-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.eval-card li {
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  font-size: 0.9rem;
}

.eval-card li:before {
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
