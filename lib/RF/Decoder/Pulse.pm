use strict;
use warnings;
package RF::Decoder::Pulse;

use base 'RF::Decoder::Base';
use RF::Utils qw/within_error_margin/;
use RF::Bits;

use constant {
  DEBUG => $ENV{RF_DECODER_PULSE_DEBUG},
  STATE_FREE => 0,
  STATE_GAP => 1,
  STATE_DATA => 2,
};

# X10: gap = 9480, gap_high = 4920, long = 1860, short = 600, low = 600
sub new {
  shift->SUPER::new(_state => STATE_FREE, @_);
}

sub recognize {
  my ($self, $value, $index, $cb) = @_;
  if ($self->is_state(STATE_FREE) &&
      within_error_margin($value, $self->{gap})) {
    warn "found gap $index: $value\n" if DEBUG;
    $self->{start} = $index;
    $self->set_state(STATE_GAP);
  } elsif ($self->is_state(STATE_GAP)) {
    if (within_error_margin($value, $self->{gap_high})) {
      warn "found gap high $index: $value\n" if DEBUG;
      $self->set_state(STATE_DATA);
      $self->{_bits} = RF::Bits->new;
      $self->set_high(0);
    } else {
      warn "high not found $index: $value\n" if DEBUG;
      $self->set_state(STATE_FREE);
    }
  } elsif ($self->is_state(STATE_DATA)) {
    if ($self->is_high) {
      if (within_error_margin($value, $self->{long})) {
        warn "found 1 $index: $value\n" if DEBUG;
        $self->{_bits}->add_bit(1);
      } elsif (within_error_margin($value, $self->{short})) {
        warn "found 0 $index: $value\n" if DEBUG;
        $self->{_bits}->add_bit(0);
      } else {
        warn "invalid high $index: $value\n" if DEBUG;
        $self->set_state(STATE_FREE);
      }
      if ($self->{_bits}->length == $self->{length}) {
        warn 'Found ', $self->{start}, '-', $index, ': ',
          $self->{_bits}->pretty, "\n" if DEBUG;
        $self->process_bits($self->{_bits}, $cb);
        $self->set_state(STATE_FREE);
        return;
      }
    } elsif (within_error_margin($value, $self->{low})) {
      # correct low
    } else {
      warn "invalid low $index: $value\n" if DEBUG;
      $self->set_state(STATE_FREE);
    }
    $self->toggle_high_low;
  }
}

1;
