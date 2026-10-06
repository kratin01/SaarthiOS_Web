export async function installFilm({ images, wordCount }) {
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d');
  const shots = Object.fromEntries(await Promise.all(Object.entries(images).map(async ([name, source]) => {
    const image = new Image();
    image.src = source;
    await image.decode();
    return [name, image];
  })));
  const ink = '#2B322E';
  const sage = '#4E7C6B';
  const orange = '#C08457';
  const blue = '#6B87A8';
  const paper = '#F6F7F4';
  const muted = '#66746D';
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const ease = (value) => 1 - (1 - clamp(value)) ** 3;
  const text = (value, left, top, size = 32, colour = ink, weight = 500) => {
    context.font = `${weight} ${size}px "Bahnschrift", "Inter", "Segoe UI", sans-serif`;
    context.fillStyle = colour;
    context.fillText(value, left, top);
  };
  const rule = (left, top, width, colour = '#DDE3DC') => {
    context.fillStyle = colour;
    context.fillRect(left, top, width, 2);
  };
  const image = (name, left, top, width, height, zoom = 1) => {
    const shot = shots[name];
    const scale = Math.min(width / shot.width, height / shot.height) * zoom * 0.96;
    const drawnWidth = shot.width * scale;
    const drawnHeight = shot.height * scale;
    context.save();
    context.beginPath();
    context.rect(left, top, width, height);
    context.clip();
    context.drawImage(shot, left + (width - drawnWidth) / 2, top + (height - drawnHeight) / 2, drawnWidth, drawnHeight);
    context.restore();
  };
  const background = (dark = false) => {
    context.fillStyle = dark ? '#233531' : paper;
    context.fillRect(0, 0, 1600, 900);
    context.strokeStyle = dark ? '#2B403A' : '#EDF0EA';
    context.lineWidth = 1;
    for (let position = 0; position < 1600; position += 80) {
      context.beginPath();
      context.moveTo(position, 0);
      context.lineTo(position, 900);
      context.stroke();
    }
    for (let position = 0; position < 900; position += 80) rule(0, position, 1600, dark ? '#2B403A' : '#EDF0EA');
  };
  const brand = (dark = false) => {
    context.fillStyle = dark ? '#BFD6C8' : sage;
    context.beginPath();
    context.arc(76, 52, 13, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = dark ? '#233531' : paper;
    context.beginPath();
    context.arc(76, 52, 4, 0, Math.PI * 2);
    context.fill();
    text('SaarthiOS', 100, 62, 28, dark ? paper : ink, 600);
    text('PRODUCT FILM  /  SAMPLE DATA', 1130, 60, 19, dark ? '#BFD6C8' : muted);
  };
  const heading = (chapter, title, time, colour = sage) => {
    const entrance = ease(time / 0.7);
    context.save();
    context.globalAlpha = entrance;
    context.translate(0, (1 - entrance) * 30);
    text(chapter, 64, 123, 20, colour, 600);
    text(title, 60, 193, 60, ink, 600);
    context.restore();
  };
  const metric = (label, value, left, time, colour, suffix = '') => {
    rule(left, 688, 440, colour);
    text(`${Math.round(value * ease(time / 1.3))}${suffix}`, left, 786, 76, colour, 600);
    text(label, left, 829, 24, muted);
  };

  window.drawFilm = (time) => {
    context.clearRect(0, 0, 1600, 900);
    const poster = time < 0;
    if (poster || time < 3) {
      background();
      brand();
      const arrival = poster ? 1 : ease(time / 1.1);
      text('Your day, connected.', 60, 178 - (1 - arrival) * 25, 94, ink, 600);
      text('One conversation. A clearer picture.', 64, 238, 31, muted);
      context.save();
      context.globalAlpha = arrival;
      image('dashboard', 140, 290, 1320, 552, 1.01 + (poster ? 0 : time * 0.006));
      context.restore();
      if (poster) {
        context.fillStyle = sage;
        context.beginPath();
        context.arc(1430, 183, 54, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.moveTo(1417, 160);
        context.lineTo(1417, 206);
        context.lineTo(1455, 183);
        context.closePath();
        context.fill();
        text('THE 34-SECOND DEMO', 649, 869, 23, sage, 600);
      }
    } else if (time < 8) {
      const local = time - 3;
      background();
      brand();
      heading('01 / SAY IT YOUR WAY', 'Life does not arrive in categories.', local);
      const progress = clamp((local - 0.3) / 3.4);
      const phrases = ['Spent 250 on lunch', 'and 80 on an auto.', 'Had 2 rotis and dal for dinner.'];
      const colours = [orange, blue, sage];
      const counts = [18, 18, 32];
      let remaining = Math.floor(progress * counts.reduce((total, count) => total + count, 0));
      phrases.forEach((phrase, index) => {
        const visible = phrase.slice(0, Math.max(0, remaining));
        text(visible, 100, 334 + index * 98, 68, colours[index], 600);
        remaining -= counts[index];
      });
      rule(64, 610, 1472);
      text('IN THE ASSISTANT', 64, 654, 18, muted, 600);
      image(`typing${Math.min(wordCount, Math.floor(progress * wordCount))}`, 64, 686, 1472, 142);
    } else if (time < 14) {
      const local = time - 8;
      background();
      brand();
      heading('02 / THE RIGHT AGENTS PICK IT UP', 'One message. Two things taken care of.', local);
      image(local < 2 ? 'saved' : 'agents', 80, 238, 1440, 402, 1 + ease(local / 6) * 0.015);
      metric('INR of expenses recorded', 330, 64, local, orange);
      metric('kcal, estimated for this meal', 420, 576, local - 0.2, sage);
      metric('g protein, estimated', 18, 1088, local - 0.4, blue);
    } else if (time < 21) {
      const local = time - 14;
      background();
      brand();
      heading('03 / YOUR OVERVIEW', 'Now it all adds up.', local);
      image('dashboard', 64, 232, 1472, 595, 1 + ease(local / 7) * 0.03);
      text('SPENDING + NUTRITION', 64, 865, 20, sage, 600);
      text('The same records. The bigger picture.', 1040, 865, 23, muted);
    } else if (time < 25) {
      const local = time - 21;
      background();
      brand();
      heading('04 / FOLLOW THE DETAILS', 'Every rupee has a place.', local, orange);
      image('expenses', 280, 221, 1040, 567, 1 + ease(local / 4) * 0.025);
      rule(64, 805, 1472);
      text('FOOD', 64, 861, 23, orange, 600);
      text('INR 250', 174, 861, 34, ink, 600);
      text('TRANSPORT', 1030, 861, 23, blue, 600);
      text('INR 80', 1240, 861, 34, ink, 600);
    } else if (time < 30.5) {
      const local = time - 25;
      background();
      brand();
      heading('05 / ASK ABOUT YOUR DAY', 'Your numbers. Not a guess.', local);
      image('answer', 80, 244, 1440, 359, 1 + ease(local / 5.5) * 0.025);
      rule(64, 652, 1472);
      text('INR 250', 64, 784, 116, orange, 600);
      text('spent on food today', 580, 741, 42, ink, 600);
      text('Lunch included. Transport kept separate.', 584, 794, 29, muted);
    } else {
      const local = time - 30.5;
      background(true);
      brand(true);
      const arrival = ease(local / 0.8);
      context.save();
      context.globalAlpha = arrival;
      context.translate(0, (1 - arrival) * 40);
      text('Less logging.', 64, 318, 138, paper, 600);
      text('More living.', 64, 478, 138, '#BFD6C8', 600);
      rule(64, 566, 1472, '#486459');
      text('SaarthiOS', 64, 676, 68, paper, 600);
      text('Your day, connected.', 64, 738, 35, '#BFD6C8');
      text('saarthios.space', 1170, 820, 31, '#BFD6C8');
      context.restore();
    }
    if (!poster) {
      const boundaries = [3, 8, 14, 21, 25, 30.5];
      const distance = Math.min(...boundaries.map((boundary) => Math.abs(time - boundary)));
      if (distance < 0.15) {
        context.globalAlpha = (1 - distance / 0.15) * 0.9;
        context.fillStyle = paper;
        context.fillRect(0, 0, 1600, 900);
        context.globalAlpha = 1;
      }
      context.fillStyle = '#C08457';
      context.fillRect(0, 894, 1600 * clamp(time / 34), 6);
    }
  };
}