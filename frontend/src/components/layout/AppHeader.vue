<script setup lang="ts">
// Sticky site header. Picks up scroll position from useScrolled and
// applies the .scrolled class to trigger blur + transparency.
import { RouterLink } from 'vue-router'
import { useScrolled } from '@/composables/useScrolled'
import logoSrc from '@/assets/logo.jpg'

const { isScrolled } = useScrolled()
</script>

<template>
  <header :class="{ scrolled: isScrolled }">
    <div class="header-inner">
      <RouterLink to="/" class="site-brand link-poly link-poly--notch link-poly--jitter">
        <span class="brand-logo-wrapper">
          <img :src="logoSrc" alt="Peter Epp" class="brand-logo" />
        </span>
        <span class="brand-name" data-text="Peter Epp"><span class="brand-name__text">Peter Epp</span></span>
      </RouterLink>
      <nav aria-label="Main navigation" class="flex gap-2">
        <RouterLink to="/portfolio" class="nav-link link-poly link-poly--slash link-poly--jitter">Portfolio</RouterLink>
        <RouterLink to="/articles" class="nav-link link-poly link-poly--slash link-poly--jitter">Articles</RouterLink>
        <RouterLink to="/job-history" class="nav-link link-poly link-poly--slash link-poly--jitter">Job History</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--color-primary-dark);
  border-bottom: 1px solid var(--color-primary);
  transition:
    background-color 0.3s cubic-bezier(0.19, 1, 0.22, 1),
    box-shadow 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

/* Marble texture lives here, not on the element itself, so backdrop-filter
   can blur what's behind the transparent header bg without being blocked
   by the texture. Opacity transitions from 1 → 0.5 when scrolled. */
header::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/images/green-marble-texture.jpg');
  background-repeat: repeat;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
  pointer-events: none;
}

header.scrolled {
  background-color: rgba(0, 45, 22, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
}

header.scrolled::before {
  opacity: 0.5;
}

.header-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 72rem;
  margin-inline: auto;
  padding: 0.75rem 1.5rem;
}

.site-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  padding: 0 0.625rem;
}

.brand-logo-wrapper {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: var(--color-primary);
  clip-path: polygon(54px 8px, 51px 41px, 54px 54px, 0px 48px, 4px 12px, 0px 0px);
}

.brand-logo {
  width: 50px;
  height: 50px;
  object-fit: cover;
  display: block;
  clip-path: polygon(50px 7px, 47px 38px, 50px 50px, 0px 45px, 4px 12px, 0px 0px);
}

.brand-name {
  position: relative;
  display: inline-block;
  isolation: isolate;
  font-family: var(--font-display);
  color: var(--color-accent-lighter);
  font-size: 2rem;
  white-space: nowrap;
}

/* Inner text sits at z-index: 1 within the isolated stacking context, above the pseudo-elements.
   Animated transforms promote pseudo-elements to their own compositing layers but they still sort
   at z-index: auto (< 1) in the paint order, so the text reliably paints on top. */
.brand-name__text {
  position: relative;
  z-index: 1;
}

.brand-name::before,
.brand-name::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  font-family: inherit;
  font-size: inherit;
}

.brand-name::before {
  color: #00ff80;
  animation: glitch-brand-before 10s linear infinite;
}

.brand-name::after {
  color: #9500ff;
  animation: glitch-brand-after 10s linear infinite;
}

/* 10s cycle: 5 bursts of varying length (100ms–480ms) scattered unevenly across the cycle.
   ::before and ::after have independent schedules — they only partially overlap,
   so sometimes one colour shows, sometimes both, sometimes neither. */
@keyframes glitch-brand-before {
  0% { transform: translate(0); opacity: 0; }

  /* Burst 1: short ~160ms. 4.2–5.8% */
  4.2% { transform: translate(-6px,  2px); opacity: 0.85; }
  4.6% { transform: translate( 9px, -1px); opacity: 0.85; }
  5.0% { transform: translate(-4px,  3px); opacity: 0.4;  }
  5.5% { transform: translate( 7px, -2px); opacity: 0.85; }
  5.8% { transform: translate( 0,   0);    opacity: 0;    }

  /* Burst 2: medium ~320ms. 19.3–22.5% */
  19%   { transform: translate(0); opacity: 0; }
  19.3% { transform: translate( 8px, -2px); opacity: 0.85; }
  19.7% { transform: translate(-6px,  3px); opacity: 0.85; }
  20.0% { transform: translate( 0,   0);    opacity: 0;    }
  20.3% { transform: translate( 5px, -4px); opacity: 0.4;  }
  20.7% { transform: translate(-7px,  1px); opacity: 0.85; }
  21.2% { transform: translate( 6px, -2px); opacity: 0.85; }
  21.7% { transform: translate( 0,   0);    opacity: 0;    }
  22.0% { transform: translate(-8px,  3px); opacity: 0.85; }
  22.5% { transform: translate( 0,   0);    opacity: 0;    }

  /* Burst 3: very short ~100ms. 37.2–38.2% */
  37%   { transform: translate(0); opacity: 0; }
  37.2% { transform: translate(-5px,  2px); opacity: 0.85; }
  37.7% { transform: translate( 7px, -3px); opacity: 0.85; }
  38.2% { transform: translate( 0,   0);    opacity: 0;    }

  /* Burst 4: medium ~310ms. 54.7–57.8% */
  54.5% { transform: translate(0); opacity: 0; }
  54.7% { transform: translate( 6px, -1px); opacity: 0.85; }
  55.1% { transform: translate(-8px,  2px); opacity: 0.85; }
  55.4% { transform: translate( 4px, -3px); opacity: 0.4;  }
  55.9% { transform: translate( 0,   0);    opacity: 0;    }
  56.3% { transform: translate(-6px,  1px); opacity: 0.85; }
  56.9% { transform: translate( 7px, -2px); opacity: 0.85; }
  57.4% { transform: translate(-5px,  3px); opacity: 0.85; }
  57.8% { transform: translate( 0,   0);    opacity: 0;    }

  /* Burst 5: longest ~480ms. 76.7–81.5% */
  76.5% { transform: translate(0); opacity: 0; }
  76.7% { transform: translate(-7px,  2px); opacity: 0.85; }
  77.1% { transform: translate( 8px, -1px); opacity: 0.85; }
  77.4% { transform: translate(-5px,  3px); opacity: 0.4;  }
  77.7% { transform: translate( 0,   0);    opacity: 0;    }
  78.0% { transform: translate( 6px, -2px); opacity: 0.85; }
  78.4% { transform: translate(-8px,  1px); opacity: 0.85; }
  78.9% { transform: translate( 5px, -3px); opacity: 0.85; }
  79.4% { transform: translate( 0,   0);    opacity: 0;    }
  79.7% { transform: translate(-6px,  2px); opacity: 0.4;  }
  80.1% { transform: translate( 7px, -1px); opacity: 0.85; }
  80.6% { transform: translate(-4px,  3px); opacity: 0.85; }
  81.1% { transform: translate( 6px, -2px); opacity: 0.85; }
  81.5% { transform: translate( 0,   0);    opacity: 0;    }

  100% { transform: translate(0); opacity: 0; }
}

@keyframes glitch-brand-after {
  0% { transform: translate(0); opacity: 0; }

  /* Burst 1: short ~170ms. 7.3–9.0% */
  7.3% { transform: translate( 7px, -2px); opacity: 0.85; }
  7.7% { transform: translate(-8px,  1px); opacity: 0.85; }
  8.2% { transform: translate( 5px, -3px); opacity: 0.4;  }
  8.7% { transform: translate(-6px,  2px); opacity: 0.85; }
  9.0% { transform: translate( 0,   0);    opacity: 0;    }

  /* Burst 2: medium ~220ms. 25.7–27.9% */
  25.5% { transform: translate(0); opacity: 0; }
  25.7% { transform: translate(-7px,  3px); opacity: 0.85; }
  26.1% { transform: translate( 8px, -1px); opacity: 0.85; }
  26.4% { transform: translate( 0,   0);    opacity: 0;    }
  26.7% { transform: translate(-5px,  2px); opacity: 0.4;  }
  27.2% { transform: translate( 6px, -3px); opacity: 0.85; }
  27.9% { transform: translate( 0,   0);    opacity: 0;    }

  /* Burst 3: very brief flash ~80ms. 47.7–48.5% */
  47.5% { transform: translate(0); opacity: 0; }
  47.7% { transform: translate( 9px, -2px); opacity: 0.85; }
  48.2% { transform: translate(-7px,  1px); opacity: 0.85; }
  48.5% { transform: translate( 0,   0);    opacity: 0;    }

  /* Burst 4: longer ~380ms. 65.7–69.5% */
  65.5% { transform: translate(0); opacity: 0; }
  65.7% { transform: translate(-6px,  2px); opacity: 0.85; }
  66.1% { transform: translate( 8px, -3px); opacity: 0.85; }
  66.4% { transform: translate(-4px,  1px); opacity: 0.4;  }
  66.8% { transform: translate( 0,   0);    opacity: 0;    }
  67.2% { transform: translate( 7px, -2px); opacity: 0.85; }
  67.6% { transform: translate(-8px,  3px); opacity: 0.85; }
  68.1% { transform: translate( 5px, -1px); opacity: 0.85; }
  68.8% { transform: translate( 0,   0);    opacity: 0;    }
  69.1% { transform: translate(-6px,  2px); opacity: 0.4;  }
  69.5% { transform: translate( 0,   0);    opacity: 0;    }

  /* Burst 5: medium-long ~430ms. 85.7–90.0% */
  85.5% { transform: translate(0); opacity: 0; }
  85.7% { transform: translate( 6px, -3px); opacity: 0.85; }
  86.1% { transform: translate(-7px,  2px); opacity: 0.85; }
  86.5% { transform: translate( 0,   0);    opacity: 0;    }
  86.8% { transform: translate( 5px, -1px); opacity: 0.4;  }
  87.3% { transform: translate(-8px,  3px); opacity: 0.85; }
  87.8% { transform: translate( 7px, -2px); opacity: 0.85; }
  88.4% { transform: translate( 0,   0);    opacity: 0;    }
  88.7% { transform: translate(-5px,  1px); opacity: 0.85; }
  89.3% { transform: translate( 6px, -3px); opacity: 0.85; }
  90.0% { transform: translate( 0,   0);    opacity: 0;    }

  100% { transform: translate(0); opacity: 0; }
}
</style>
