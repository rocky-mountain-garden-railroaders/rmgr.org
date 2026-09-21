<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { type CalendarEvent, parseGoogleCalendarIcs } from '@/lib/googleCalendar'

defineOptions({ name: 'UpcomingEvents' })

const eventData = ref<CalendarEvent[]>([])
const showPastEvents = ref(false)

const isPastEvent = (event: CalendarEvent) => {
  const cutoff = event.endsAt ?? event.startsAt
  return Date.parse(cutoff) < Date.now()
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
})

defineExpose({
  eventData,
  upcomingEvents,
  pastEvents,
  visibleEvents,
  showPastEvents,
})
</script>

<template>
  <v-container class="pa-8 bg-background" fluid>
    <v-row no-gutters>
      <v-col class="bg-surface pa-4 rounded-t-lg" cols="12">
        <v-card class="w-100 bg-surface" flat>
          <v-card-item>
            <v-card-title class="text-h4 font-weight-black text-primary pl-0">
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

      <v-col class="bg-primary pa-6 pa-sm-12 rounded-b-lg" cols="12">
        <v-card class="w-100 text-surface" color="transparent" flat>
          <div v-if="visibleEvents.length === 0" class="text-center py-12 opacity-70">
            <div class="text-h6 font-weight-light">
              {{
                showPastEvents
                  ? 'No past events to show.'
                  : 'No upcoming events scheduled right now.'
              }}
            </div>
            <div class="text-body-2 opacity-80 mt-1">
              Check back soon or send us a message via our contact page!
            </div>
          </div>

          <div v-else>
            <div v-for="(event, index) in visibleEvents" :key="index">
              <component
                :is="event.url ? 'a' : 'div'"
                :aria-label="event.url ? `Open ${event.title}` : undefined"
                :class="{ 'event-card--clickable': !!event.url }"
                :href="event.url || undefined"
                :rel="event.url ? 'noopener noreferrer' : undefined"
                :target="event.url ? '_blank' : undefined"
                class="event-card d-block text-decoration-none text-inherit"
              >
                <v-row align="center" class="event-row">
                  <v-col class="event-meta-col" cols="12" md="2.5" sm="3">
                    <div class="event-date text-secondary font-weight-bold mb-1">
                      {{ event.date }}
                    </div>
                    <div class="event-time text-body-1 font-weight-light opacity-80">
                      {{ event.time }}
                    </div>
                  </v-col>

                  <v-col cols="12" md="8" sm="9">
                    <div class="d-flex align-center flex-wrap gap-2 mb-1">
                      <h3 class="event-title text-h5 font-weight-bold tracking-tight">
                        {{ event.title }}
                      </h3>
                      <v-icon
                        v-if="event.url"
                        class="event-title-icon event-title-icon--inline text-secondary"
                        icon="mdi-open-in-new"
                        size="24"
                      ></v-icon>
                    </div>
                    <div class="event-location text-body-1 opacity-80 font-weight-light">
                      {{ event.location }}
                    </div>
                    <p
                      v-if="event.description"
                      class="body-copy text-body-1 font-weight-light opacity-90"
                    >
                      {{ event.description }}
                    </p>
                  </v-col>

                  <v-col class="d-flex align-center justify-end event-action-col" cols="12" md="1" sm="3">
                    <v-icon
                      v-if="event.url"
                      class="event-title-icon text-secondary"
                      icon="mdi-open-in-new"
                      size="32"
                    ></v-icon>
                  </v-col>
                </v-row>
              </component>

              <v-divider
                v-if="index < visibleEvents.length - 1"
                class="my-6 opacity-10"
                color="surface"
              ></v-divider>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.event-date {
  letter-spacing: 0.04em;
  font-size: 1.125rem;
}

.event-time,
.event-location,
.event-title {
  line-height: 1.35;
}

.event-meta-col {
  max-width: 300px;
}

.event-action-col {
  min-width: 44px;
  min-height: 100%;
}

.event-card {
  color: inherit;
  border-radius: 16px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.event-card--clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.event-card--clickable:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary), 0.55);
  outline-offset: 3px;
}

.event-row {
  padding: 4px 0;
}

.event-card--clickable .event-row {
  cursor: pointer;
}

.event-title-icon {
  flex: 0 0 auto;
  opacity: 0.95;
}

.event-title-icon--inline {
  display: none;
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

@media (max-width: 960px) {
  .event-meta-col {
    max-width: none;
  }

  .event-action-col {
    display: none !important;
  }

  .event-title-icon--inline {
    display: inline-flex;
    padding-left: 4px;
    margin-top: 2px;
  }
}
</style>
