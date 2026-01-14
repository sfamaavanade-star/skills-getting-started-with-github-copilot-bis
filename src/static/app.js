document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants" aria-live="polite" style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid #eee;">
            <h5 style="margin:0 0 0.25rem 0;font-size:0.95rem;color:#333;">Participants</h5>
            <ul class="participants-list" style="list-style:disc;margin:0 0 0 1.25rem;padding:0;"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants list
        const participantsList = activityCard.querySelector(".participants-list");
        const renderNoParticipants = () => {
          participantsList.innerHTML = "";
          const li = document.createElement("li");
          li.textContent = "No participants yet";
          li.className = "no-participants";
          li.style.fontStyle = "italic";
          li.style.color = "#555";
          participantsList.appendChild(li);
        };

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            li.style.marginBottom = "0.25rem";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const btn = document.createElement("button");
            btn.className = "delete-participant";
            btn.setAttribute("aria-label", `Remove ${p}`);
            btn.dataset.email = p;
            btn.dataset.activity = name;
            btn.textContent = "✖";

            btn.addEventListener("click", async (e) => {
              e.stopPropagation();
              const activityName = btn.dataset.activity;
              const email = btn.dataset.email;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                if (res.ok) {
                  // remove from DOM
                  li.remove();

                  // if list becomes empty, show placeholder
                  const remaining = participantsList.querySelectorAll(".participant-item");
                  if (remaining.length === 0) renderNoParticipants();

                  messageDiv.textContent = `${email} removed from ${activityName}`;
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                } else {
                  const data = await res.json().catch(() => ({}));
                  messageDiv.textContent = data.detail || "Failed to remove participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (err) {
                console.error("Error removing participant:", err);
                messageDiv.textContent = "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
            participantsList.appendChild(li);
          });
        } else {
          renderNoParticipants();
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
