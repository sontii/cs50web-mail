document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // event listener for send mail
  document.querySelector('#compose-form').addEventListener('submit', send_mail);

});


function send_mail() {
  event.preventDefault()
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    if ("message" in result) {
      // The email was sent successfully!
      myAlert = document.querySelector('#myAlert');
      const alert = document.createElement('div');
      alert.className="alert alert-success";
      alert.innerHTML = result['message'];
      myAlert.appendChild(alert)
      load_mailbox('sent');
    }
    if ("error" in result) {
      myAlert = document.querySelector('#myAlert');
      const alert = document.createElement('div');
      alert.className="alert alert-danger";
      alert.innerHTML = result['error'];
      myAlert.appendChild(alert)
    }
  });

  window.setTimeout(function() {
    $(".alert").fadeTo(500, 0).slideUp(500, function(){
        $(this).remove(); 
    });
}, 2000);
    
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector("#emails-view").innerHTML = "";

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // get selected mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
 
    emails.forEach(mail => {
      const container = document.createElement('div');
      container.className ='container';
      container.id = 'emaildiv';
      
      container.addEventListener('click', () => view_mail(mail.id));
      document.querySelector('#emails-view').appendChild(container);

      const row = document.createElement('div');
      row.className ='row';
      container.appendChild(row);
      
      //gray if read true
      if (mail.read === true){
        row.style.backgroundColor = 'gray';
      } else {
        row.style.backgroundColor = 'white';
      }
      
      const mailDiv = document.createElement('div');
      mailDiv.className ='col-3';
      if (mailbox === "inbox"){
        mailDiv.innerHTML = `<strong>${mail.sender}</strong>`;
      } else if (mailbox === "sent"){
        mailDiv.innerHTML = `<strong>${mail.recipients}</strong>`;
      } else if (mailbox === "archive"){
        mailDiv.innerHTML = `<strong>${mail.sender}</strong>`;
      }
      row.appendChild(mailDiv);

      const subDiv = document.createElement('div');
      subDiv.className ='col';
      subDiv.innerHTML = mail.subject;
      row.appendChild(subDiv);

      const timeDiv = document.createElement('div');
      timeDiv.className ='col-3';
      timeDiv.innerHTML = mail.timestamp;
      row.appendChild(timeDiv);
    });
});
}

function view_mail(id) {

  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector("#emails-view").innerHTML = "";

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const from = document.createElement('div');
    from.innerHTML = `<strong>From: </strong>${email.sender}`;
    const to = document.createElement('div');
    to.innerHTML = `<strong>To: </strong>${email.recipients}`;
    const subject = document.createElement('div');
    subject.innerHTML = `<strong>Subject: </strong>${email.subject}`;
    const timestamp = document.createElement('div');
    timestamp.innerHTML = `<strong>Timestamp: </strong>${email.timestamp}`;
    const replybutton = document.createElement('button');
    replybutton.id = 'replybutton';
    replybutton.className="btn btn-outline-primary";
    replybutton.innerHTML = 'Reply';
    const archivebutton = document.createElement('button');
    archivebutton.id = 'archivebutton';
    archivebutton.className="btn btn-outline-primary";
    const space = document.createTextNode (" ");
    if (email.archived === true){
      archivebutton.innerHTML = 'Unarchive';
    } else {
      archivebutton.innerHTML = 'Archive';
    }
    const hr = document.createElement(`hr`);
    const body = document.createElement('div');
    body.innerHTML = email.body;
    //click listeners
    replybutton.addEventListener('click', () => reply_mail(email.sender, email.subject, email.timestamp, email.body));
    archivebutton.addEventListener('click', () => archive_mail(email.id, email.archived));

    document.querySelector('#emails-view').append(from, to , subject, timestamp, replybutton, space, archivebutton, hr, body);
    
  });
  // mark read when opened
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
    read: true    
    })
  }) .then();
} 

function reply_mail(sender, subject, timestamp, body) {
  if (subject.substring(0,3) !== 'Re:'){
    subject = `Re: ${subject}`;
  }
  //format RE original text
  rebody = `"On ${timestamp} ${sender} wrote: ${body}"`

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // composition fields
  document.querySelector('#compose-recipients').value = `${sender}`;
  document.querySelector('#compose-subject').value = `${subject}`;
  document.querySelector('#compose-body').value = `${rebody}`;

}

function archive_mail(id, archived) {
  if (archived === true){
    archived = false;
  } else {
    archived = true;
  }
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
    archived: archived    
    })
  })
  .then( () => load_mailbox('inbox'))
}