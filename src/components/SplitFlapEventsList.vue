<script lang="ts" setup>
import { computed } from 'vue'
import SplitFlapText from '@/components/SplitFlapText.vue'
import type { CalendarEvent } from '@/lib/googleCalendar'
import { ignoreClickAfterSelection, isMappableLocation, openInMaps } from '@/utils/eventLinks'

const props = defineProps<{
  events: CalendarEvent[]
  showPastEvents: boolean
  now: number
}>()

const pageTitle = computed(() => (props.showPastEvents ? 'Past Events' : 'Upcoming Events'))

const rowDelay = (index: number) => Math.min(index, 6) * 180

const boardClockFormatter = new Intl.DateTimeFormat('en-CA', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Edmonton',
})

const boardClock = computed(() => boardClockFormatter.format(props.now))

const tickerLead = computed(() =>
  props.showPastEvents
    ? 'Thanks for riding with the Rocky Mountain Garden Railroaders'
    : 'Welcome aboard the Rocky Mountain Garden Railroad',
)

const tickerMessage = computed(() => {
  const titles = [...new Set(props.events.map((event) => event.title))].slice(0, 6)
  return [tickerLead.value, ...titles].join('  ◆  ')
})
</script>

<template>
  <v-col class="bg-primary pa-2 pa-sm-8 rounded-b-lg" cols="12">
    <section :aria-label="pageTitle" class="ticker-board">
      <header class="board-header">
        <div class="board-name">
          <v-icon aria-hidden="true" class="board-name-icon" icon="mdi-train" size="28"></v-icon>
          <span>{{ showPastEvents ? 'Arrivals' : 'Departures' }}</span>
        </div>
        <div class="board-clock" aria-hidden="true">{{ boardClock }}</div>
      </header>

      <div class="board-columns" aria-hidden="true">
        <span>{{ showPastEvents ? 'Arrived' : 'Departs' }}</span>
        <span>Event</span>
        <span>Location</span>
        <span></span>
      </div>

      <transition mode="out-in" name="events-fade">
        <div v-if="events.length === 0" :key="`empty-${showPastEvents}`" class="board-empty">
          <div class="board-empty-title">
            {{
              showPastEvents ? 'No past events to show.' : 'No upcoming events scheduled right now.'
            }}
          </div>
          <div class="board-empty-hint">
            Check back soon or send us a message via our contact page!
          </div>
        </div>

        <ul v-else :key="`events-${showPastEvents}`" class="board-rows">
          <li v-for="(event, index) in events" :key="index" class="board-row-item">
            <component
              :is="event.url ? 'a' : 'div'"
              :aria-label="event.url ? `Open ${event.title}` : undefined"
              :class="{ 'event-card--clickable': !!event.url }"
              :href="event.url || undefined"
              :rel="event.url ? 'noopener noreferrer' : undefined"
              :target="event.url ? '_blank' : undefined"
              class="event-card board-row text-decoration-none"
              draggable="false"
              @click="ignoreClickAfterSelection"
            >
              <span class="board-cell board-departs">
                <SplitFlapText
                  :delay="rowDelay(index)"
                  :text="event.date"
                  class="board-date"
                  tiles
                />
                <SplitFlapText
                  :delay="rowDelay(index) + 150"
                  :text="event.time"
                  class="board-time"
                  tiles
                />
              </span>
              <div class="board-cell board-event">
                <h3 class="event-title">
                  <SplitFlapText :delay="rowDelay(index) + 100" :text="event.title" tiles />
                </h3>
                <p v-if="event.description" class="board-description">
                  {{ event.description }}
                </p>
              </div>
              <span
                v-if="isMappableLocation(event.location)"
                :aria-label="`Open ${event.location} in Google Maps`"
                class="board-cell board-location-cell event-location-link"
                role="link"
                tabindex="0"
                @click="openInMaps($event, event.location)"
                @keydown.enter="openInMaps($event, event.location)"
              >
                <SplitFlapText
                  :delay="rowDelay(index) + 200"
                  :text="event.location"
                  class="board-location"
                  tiles
                />
              </span>
              <span v-else class="board-cell board-location-cell">
                <SplitFlapText
                  v-if="event.location"
                  :delay="rowDelay(index) + 200"
                  :text="event.location"
                  class="board-location"
                  tiles
                />
              </span>
              <div class="board-cell board-link-col event-action-col">
                <v-icon
                  v-if="event.url"
                  aria-hidden="true"
                  class="board-link-icon"
                  icon="mdi-open-in-new"
                  size="28"
                ></v-icon>
              </div>
            </component>
          </li>
        </ul>
      </transition>

      <div class="board-ticker" aria-hidden="true">
        <div class="board-ticker-track">
          <span>{{ tickerMessage }}</span>
          <span>{{ tickerMessage }}</span>
        </div>
        <div class="board-ticker-static">{{ tickerLead }}</div>
      </div>
    </section>
  </v-col>
</template>

<style scoped src="@/styles/event-views.css"></style>

<style scoped>
.ticker-board {
  --board-charcoal: var(--v-theme-on-surface);
  --board-bg: rgb(var(--board-charcoal));
  --board-deep: color-mix(in srgb, rgb(var(--board-charcoal)) 75%, black);
  --board-panel: color-mix(in srgb, rgb(var(--board-charcoal)) 92%, rgb(var(--v-theme-surface)));
  --board-line: rgba(var(--v-theme-background), 0.18);
  --board-amber: rgb(var(--v-theme-secondary));
  --board-amber-bright: #ffc94a;
  --board-text: rgb(var(--v-theme-surface));
  --board-muted: rgb(var(--v-theme-background));
  --board-font: 'Courier New', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;

  overflow: hidden;
  color: var(--board-text);
  container-type: inline-size;
  font-family: var(--board-font);
  background: var(--board-bg);
  border: 6px solid var(--board-deep);
  border-radius: 12px;
  box-shadow:
    inset 0 0 0 1px var(--board-deep),
    0 18px 40px rgba(var(--board-charcoal), 0.35);
}

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  background: linear-gradient(180deg, var(--board-panel), var(--board-deep));
  border-bottom: 3px solid rgb(var(--v-theme-secondary));
}

.board-name {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--board-amber);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.board-name-icon {
  color: var(--board-amber);
}

.board-clock {
  padding: 0.2rem 0.6rem;
  color: var(--board-text);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  background: var(--board-deep);
  border: 1px solid var(--board-line);
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}

.board-columns,
.board-row {
  display: grid;
  grid-template-columns: 14.25rem minmax(0, 2fr) minmax(0, 2.2fr) 2rem;
  column-gap: 1.25rem;
  align-items: center;
  padding: 0.85rem 1.25rem;
}

.board-columns {
  padding-block: 0.5rem;
  color: var(--board-muted);
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  background: var(--board-panel);
  border-bottom: 1px solid var(--board-line);
}

.board-rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.board-row-item:nth-child(even) .board-row {
  background: rgba(var(--v-theme-surface), 0.03);
}

.board-row-item + .board-row-item .board-row {
  border-top: 1px dashed var(--board-line);
}

.board-row {
  color: inherit;
  transition: background-color 0.15s ease;
}

.board-cell {
  min-width: 0;
  overflow-wrap: anywhere;
}

.board-date,
.board-time,
.ticker-board .event-title,
.board-location {
  letter-spacing: 0.06em;
}

.board-location-cell {
  position: relative;
  justify-self: start;
  margin: -0.3rem -0.4rem;
  padding: 0.3rem 0.4rem;
  border-radius: 4px;
}

.board-departs {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.board-date {
  color: var(--board-amber-bright);
  font-weight: 700;
}

.board-time {
  color: var(--board-amber-bright);
  font-size: 0.9rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ticker-board .event-title {
  margin: 0;
  color: var(--board-text);
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.3;
}

.board-description {
  margin: 0.3rem 0 0;
  color: var(--board-muted);
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.45;
}

.board-location {
  color: var(--board-text);
  font-size: 0.9rem;
  line-height: 1.4;
}

.board-link-col {
  display: flex;
  justify-content: flex-end;
}

.board-link-icon {
  color: var(--board-amber);
}

.ticker-board .event-card--clickable:hover {
  background-color: rgba(var(--v-theme-secondary), 0.12) !important;
}

.ticker-board .event-card--clickable:hover .event-title {
  color: var(--board-amber);
}

.ticker-board .event-card--clickable:focus-visible {
  outline: 2px solid var(--board-amber);
  outline-offset: -4px;
}

.board-empty {
  padding: 3rem 1.25rem;
  text-align: center;
}

.board-empty-title {
  color: var(--board-amber);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.board-empty-hint {
  margin-top: 0.4rem;
  color: var(--board-muted);
  font-size: 0.9rem;
}

.board-ticker {
  overflow: hidden;
  padding: 0.55rem 0;
  color: var(--board-amber);
  font-size: 0.9rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  background: var(--board-deep);
  border-top: 3px solid rgb(var(--v-theme-secondary));
}

.board-ticker-track {
  display: inline-flex;
  animation: ticker-scroll 40s linear infinite;
}

.board-ticker-track span {
  padding-right: 4rem;
}

.board-ticker-static {
  display: none;
  padding-inline: 1.25rem;
  white-space: normal;
}

@keyframes ticker-scroll {
  to {
    transform: translateX(-50%);
  }
}

@container (max-width: 1000px) {
  .board-columns {
    display: none;
  }

  .board-row {
    grid-template-columns: 14.25rem minmax(0, 1fr) auto;
    grid-template-areas:
      'departs event link'
      'departs location link';
    row-gap: 0.5rem;
  }

  .board-departs {
    grid-area: departs;
    align-self: start;
  }

  .board-event {
    grid-area: event;
  }

  .board-location-cell {
    grid-area: location;
  }

  .board-link-col {
    grid-area: link;
  }
}

@media (max-width: 700px) {
  .ticker-board {
    border-width: 3px;
    border-radius: 8px;
  }
}

@container (max-width: 700px) {
  .board-row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'departs link'
      'event event'
      'location location';
    row-gap: 0.5rem;
    padding: 0.85rem 0.75rem;
  }

  .board-link-col {
    align-self: start;
  }

  .board-header {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
  }

  .board-name {
    gap: 0.4rem;
    letter-spacing: 0.1em;
  }

  .board-name,
  .board-clock {
    font-size: 1rem;
  }

  .board-date,
  .board-time,
  .board-location {
    font-size: 0.8rem;
  }

  .ticker-board .event-title {
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .board-ticker-track {
    animation: none;
  }

  .board-ticker-track {
    display: none;
  }

  .board-ticker-static {
    display: block;
  }
}
</style>
