import { useEffect, useState } from "react";
import io from "socket.io-client";
import Modal from "./Modal";
const URL = import.meta.env.VITE_BASE_URL;
const socket = io(`${URL}`);
import { useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";

const formattedDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  //   second: "2-digit",
  hour12: true, // Use 12-hour time; set to false for 24-hour time
});

const NavBar = ({ toggleLogin, handleLogout , refresh, setRefresh}) => {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [reminderInfoId, setreminderInfoId]= useState(null);

  const navigate = useNavigate();


  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${URL}/api/reminders/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Reminder deleted successfully');
        setRefresh(!refresh);
      } else {
        console.error('Failed to delete reminder');
        console.error('Response status:', response.status);
        const responseBody = await response.json();
        console.error('Response body:', responseBody);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  useEffect(() => {
    if (!toggleLogin) setUser(null);

    if (toggleLogin) {
      const token = localStorage.getItem("token");
      if (token) {
        // remember to use the new URL for the fetch using the checkController
        fetch(`${URL}/api/check/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("navuser", data.user);
            setUser(data.user);
          })
          .catch((error) => console.error("Error fetching user:", error));
      }
    }
  }, [toggleLogin]);

  useEffect(() => {
    //We only want this useEffect to run when the user is logged in
    if (toggleLogin) {
      // This is the socket.on method to listen for the remindersDue event in the backend schedule.js file
      socket.on("remindersDue", (receivedReminders) => {
        if (receivedReminders.length > 0) {
          // This is the content for the modal
          setModalContent(
            <div>
              <p>{receivedReminders[0].pet_name} is scheduled for </p>
              <p>MessageType: {receivedReminders[0].reminder_type}</p>
              <p>Message: {receivedReminders[0].reminder_message}</p>
              <p>
                at {formattedDate.format(new Date(receivedReminders[0].reminder_time))}
              </p>
            </div>
          );

        setIsModalOpen(true);
        // Store the ID of the first reminder for further reference
        setreminderInfoId(receivedReminders[0].id);
        }
      });

    // log reminders for debugging
    // socket.on("remindersDue", (receivedReminders) => {
    //   console.log("receivedReminders", receivedReminders);
    // });

    // added this return to avoid memory leaks. 
    //It turns the socket.on method off when the component is unmounted
      return () => {
        socket.off("remindersDue");
      };
    }
  }, [toggleLogin]);

  return (
    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-sky-300">
      <div className="px-4  py-2 flex flex-row justify-between"></div>
          <Link to={"/pets"}>
            <div className="font-bold text-3xl text-white inline-block">
              <span className="">P</span>et
              <span className="">P</span>ulse
            </div>
          </Link>
        {!toggleLogin ? (
          <Link to={"/login"}>
            <span className="hover:text-white">Login</span>
          </Link>
        ) : (
          <div>
            {user && <span>Hello, {user.username.toUpperCase()} | </span>}
            <Link onClick={handleLogout}>
              <span className="hover:text-white">Logout</span>
            </Link>
          </div>
        )}

        <hr />
        {/* We are creating a modal to show the reminders. It will pop up each time the socket.on method is triggered in the backend schedule.js file. We give it an onClose method to close the modal by clicking ok and we reset the modalContent and isModalOpen to false */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalContent("");
            handleDelete(reminderInfoId)
          }}
        >
          {modalContent}
        </Modal>
    </div>
  );
};

export default NavBar;