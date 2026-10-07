<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import SplitFlapText from '@/components/SplitFlapText.vue'
import { type CalendarEvent, parseGoogleCalendarIcs } from '@/lib/googleCalendar'

defineOptions({ name: 'UpcomingEvents' })

const eventData = ref<CalendarEvent[]>([])
const showPastEvents = ref(false)

const now = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | undefined

const isPastEvent = (event: CalendarEvent) => {
  const cutoff = event.endsAt ?? event.startsAt
  return Date.parse(cutoff) < now.value
}

const upcomingEvents = computed(() => {
  return eventData.value.filter((event) => !isPastEvent(event))
})

const pastEvents = computed(() => {
  return eventData.value
    .filter((event) => isPastEvent(event))
    .slice()
    .reverse()
})

const visibleEvents = computed(() => {
  return showPastEvents.value ? pastEvents.value : upcomingEvents.value
})

const pageTitle = computed(() => (showPastEvents.value ? 'Past Events' : 'Upcoming Events'))

const rowDelay = (index: number) => Math.min(index, 6) * 180

const boardClockFormatter = new Intl.DateTimeFormat('en-CA', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Edmonton',
})

const boardClock = computed(() => boardClockFormatter.format(now.value))

const tickerLead = computed(() =>
  showPastEvents.value
    ? 'Thanks for riding with the Rocky Mountain Garden Railroaders'
    : 'Welcome aboard the Rocky Mountain Garden Railroad',
)

const tickerMessage = computed(() => {
  const titles = [...new Set(visibleEvents.value.map((event) => event.title))].slice(0, 6)
  return [tickerLead.value, ...titles].join('  ◆  ')
})

const ignoreClickAfterSelection = (event: MouseEvent) => {
  const selection = window.getSelection()
  const card = event.currentTarget as Node
  if (selection && !selection.isCollapsed && selection.containsNode(card, true)) {
    event.preventDefault()
  }
}

const togglePastEvents = () => {
  showPastEvents.value = !showPastEvents.value
}

const calendarFeedUrl = '/calendar-ics'

const loadCalendarEvents = async () => {
  if (!calendarFeedUrl) {
    return
  }

  const response = await fetch(calendarFeedUrl)
  const ics = await response.text()
  eventData.value = parseGoogleCalendarIcs(ics)
}

onMounted(() => {
  void loadCalendarEvents()
  nowTimer = setInterval(() => {
    now.value = Date.now()
  }, 60_000)
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})

defineExpose({
  eventData,
  upcomingEvents,
  pastEvents,
  visibleEvents,
  showPastEvents,
  now,
})
</script>

<template>
  <v-container class="pa-4 pa-sm-8 bg-background" fluid>
    <v-row no-gutters>
      <v-col class="bg-surface pa-4 rounded-t-lg" cols="12">
        <v-card class="w-100 bg-surface" flat>
          <v-card-item>
            <v-card-title class="text-h4 font-weight-black text-primary text-wrap pl-0">
              {{ pageTitle }}
            </v-card-title>
            <v-card-subtitle
              class="pa-0 mt-2 text-body-2 text-medium-emphasis d-flex align-center flex-wrap"
              style="column-gap: 2rem; row-gap: 0.5rem"
            >
              <a class="subscribe-link d-inline-flex align-center" :href="calendarFeedUrl" rel="noopener noreferrer" target="_blank">
                <v-icon class="me-1" icon="mdi-calendar" size="16"></v-icon>
                <span>Subscribe to this calendar</span>
              </a>
              <button class="past-toggle-btn subscribe-link d-inline-flex align-center" type="button" @click="togglePastEvents">
                <v-icon class="me-1" :icon="showPastEvents ? 'mdi-calendar-arrow-right' : 'mdi-history'" size="16"></v-icon>
                <span>{{ showPastEvents ? 'View upcoming events' : 'View past events' }}</span>
              </button>
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>

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
            <span>Departs</span>
            <span>Event</span>
            <span>Location</span>
            <span></span>
          </div>

          <transition mode="out-in" name="events-fade">
            <div v-if="visibleEvents.length === 0" :key="`empty-${showPastEvents}`" class="board-empty">
              <div class="board-empty-title">
                {{
                  showPastEvents
                    ? 'No past events to show.'
                    : 'No upcoming events scheduled right now.'
                }}
              </div>
              <div class="board-empty-hint">
                Check back soon or send us a message via our contact page!
              </div>
            </div>

            <ul v-else :key="`events-${showPastEvents}`" class="board-rows">
              <li
                v-for="(event, index) in visibleEvents"
                :key="index"
                class="board-row-item"
              >
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
                    <SplitFlapText :delay="rowDelay(index)" :text="event.date" class="board-date" tiles />
                    <SplitFlapText :delay="rowDelay(index) + 150" :text="event.time" class="board-time" tiles />
                  </span>
                  <div class="board-cell board-event">
                    <h3 class="event-title">
                      <SplitFlapText :delay="rowDelay(index) + 100" :text="event.title" tiles />
                    </h3>
                    <p v-if="event.description" class="board-description">
                      {{ event.description }}
                    </p>
                  </div>
                  <SplitFlapText
                    :delay="rowDelay(index) + 200"
                    :text="event.location"
                    class="board-cell board-location"
                    tiles
                  />
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

    </v-row>
  </v-container>
</template>

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
  grid-template-columns:
    14.25rem minmax(0, 2fr) minmax(0, 2.2fr) 2rem;
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

.ticker-board .event-card--clickable {
  cursor: pointer;
  user-select: text;
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

.events-fade-enter-active,
.events-fade-leave-active {
  transition: opacity 0.18s ease;
}

.events-fade-enter-from,
.events-fade-leave-to {
  opacity: 0;
}

@keyframes ticker-scroll {
  to {
    transform: translateX(-50%);
  }
}

.subscribe-link {
  color: inherit;
  text-decoration: none;
  text-underline-offset: 0.18em;
}

.subscribe-link span {
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.past-toggle-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
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

  .board-location {
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
