<script lang="ts" setup>
import { computed } from 'vue'
import type { CalendarEvent } from '@/lib/googleCalendar'
import { ignoreClickAfterSelection } from '@/utils/eventLinks'

const props = defineProps<{
  events: CalendarEvent[]
  showPastEvents: boolean
}>()

const pageTitle = computed(() => (props.showPastEvents ? 'Past Events' : 'Upcoming Events'))
</script>

<template>
  <v-col class="bg-primary pa-6 pa-sm-12 rounded-b-lg" cols="12">
    <section :aria-label="pageTitle" class="events-list text-surface">
      <transition mode="out-in" name="events-fade">
        <div
          v-if="events.length === 0"
          :key="`empty-${showPastEvents}`"
          class="text-center py-12 opacity-70"
        >
          <div class="text-h6 font-weight-light">
            {{
              showPastEvents ? 'No past events to show.' : 'No upcoming events scheduled right now.'
            }}
          </div>
          <div class="text-body-2 opacity-80 mt-1">
            Check back soon or send us a message via our contact page!
          </div>
        </div>
        <div v-else :key="`events-${showPastEvents}`">
          <div v-for="(event, index) in events" :key="index">
            <component
              :is="event.url ? 'a' : 'div'"
              :aria-label="event.url ? `Open ${event.title}` : undefined"
              :class="{ 'event-card--clickable': !!event.url }"
              :href="event.url || undefined"
              :rel="event.url ? 'noopener noreferrer' : undefined"
              :target="event.url ? '_blank' : undefined"
              class="event-card d-block text-decoration-none"
              draggable="false"
              @click="ignoreClickAfterSelection"
            >
              <v-row align="center" class="event-row">
                <v-col class="event-meta-col" cols="12" md="3" sm="3">
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
                      aria-hidden="true"
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
                <v-col class="d-flex align-center justify-end event-action-col" cols="12" md="1">
                  <v-icon
                    v-if="event.url"
                    aria-hidden="true"
                    class="event-title-icon text-secondary"
                    icon="mdi-open-in-new"
                    size="32"
                  ></v-icon>
                </v-col>
              </v-row>
            </component>
            <v-divider
              v-if="index < events.length - 1"
              class="my-6 opacity-10"
              color="surface"
            ></v-divider>
          </div>
        </div>
      </transition>
    </section>
  </v-col>
</template>

<style scoped>
.events-list .event-card {
  color: inherit;
  border-radius: 16px;
  overflow-wrap: anywhere;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.events-list .event-card--clickable {
  cursor: pointer;
  user-select: text;
}

.events-list .event-card--clickable:hover {
  background-color: rgba(var(--v-theme-surface), 0.04);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.events-list .event-card--clickable:focus-visible {
  outline: 2px solid rgb(var(--v-theme-secondary));
  outline-offset: 3px;
}

.events-list .event-date {
  letter-spacing: 0.04em;
  font-size: 1.125rem;
}

.events-list .event-time,
.events-list .event-location,
.events-list .event-title {
  line-height: 1.35;
}

.events-list .event-meta-col {
  max-width: 300px;
}

.events-list .event-row {
  padding: 4px 0;
}

.events-list .event-title-icon {
  flex: 0 0 auto;
  opacity: 0.95;
}

.events-list .event-title-icon--inline {
  display: none;
}

.events-fade-enter-active,
.events-fade-leave-active {
  transition: opacity 0.18s ease;
}

.events-fade-enter-from,
.events-fade-leave-to {
  opacity: 0;
}

@media (max-width: 959.98px) {
  .events-list .event-meta-col {
    max-width: none;
  }

  .events-list .event-action-col {
    display: none !important;
  }

  .events-list .event-title-icon--inline {
    display: inline-flex;
    padding-left: 4px;
    margin-top: 2px;
  }
}
</style>
